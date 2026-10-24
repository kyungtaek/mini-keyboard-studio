import test from 'node:test';
import assert from 'node:assert/strict';
import {connectCompanionDevice} from '../src/companion.js';
import {companionCall} from '../src/companion.js';

test('refreshing a companion connection rebinds its path only to the same serial and identity',async()=>{
 const oldBridge=globalThis.miniKeyboardDesktop,requests=[];
 const binding={vendorId:0x514c,productId:0x8850,identity:[16,3,11],serialNumber:'board-A'};let info={...binding,pathHex:'old'};
 globalThis.miniKeyboardDesktop={version:1,call:async(command,args)=>{requests.push(command);if(command==='open')return info;if(command==='exchange')return {reports:[{reportId:3,data:[251,16,3,11,...Array(59).fill(0)]}]};return {};}};
 try{
  const controller=await connectCompanionDevice();requests.length=0;
  info={...binding,pathHex:'new'};await controller.ensureConnected();assert.equal(controller.hidDevice.pathHex,'new');assert.deepEqual(requests,['open']);
  info={...binding,pathHex:'other',serialNumber:'board-B'};await assert.rejects(controller.ensureConnected(),/연결/);assert.equal(controller.hidDevice.pathHex,'new');
  info={...binding,identity:[3,1,11],pathHex:'other'};await assert.rejects(controller.ensureConnected(),/연결/);assert.equal(controller.hidDevice.pathHex,'new');
 }finally{if(oldBridge===undefined)delete globalThis.miniKeyboardDesktop;else globalThis.miniKeyboardDesktop=oldBridge;}
});

test('USB write failures are actionable without exposing the Electron invocation wrapper or retrying',async()=>{
 const oldBridge=globalThis.miniKeyboardDesktop;let calls=0;
 globalThis.miniKeyboardDesktop={version:1,call:async()=>{calls++;throw Error("Error invoking remote method 'mini:companion': Error: incomplete HID write (-1/65 bytes)");}};
 try{await assert.rejects(companionCall('readLighting'),error=>error.code==='MINI_USB_DISCONNECTED'&&/USB/.test(error.message)&&/다시 연결/.test(error.message)&&!error.message.includes('invoking remote'));assert.equal(calls,1);}
 finally{if(oldBridge===undefined)delete globalThis.miniKeyboardDesktop;else globalThis.miniKeyboardDesktop=oldBridge;}
});

test('desktop calls its isolated preload bridge without an HTTP server',async()=>{
 const oldFetch=globalThis.fetch,oldBridge=globalThis.miniKeyboardDesktop;
 globalThis.fetch=()=>{throw Error('HTTP must not be used');};
 globalThis.miniKeyboardDesktop={version:1,call:async(command,args)=>({command,args})};
 try{assert.deepEqual(await companionCall('state',{event:{version:1,source:'manual',state:'done'}}),{command:'state',args:{event:{version:1,source:'manual',state:'done'}}});}
 finally{globalThis.fetch=oldFetch;if(oldBridge===undefined)delete globalThis.miniKeyboardDesktop;else globalThis.miniKeyboardDesktop=oldBridge;}
});

test('transaction acquisition binds key apply and restore to the opened device',async()=>{
 const oldBridge=globalThis.miniKeyboardDesktop,requests=[];
 const binding={vendorId:0x514c,productId:0x8850,identity:[16,3,11],serialNumber:'board-A'};
 globalThis.miniKeyboardDesktop={version:1,call:async(command,args)=>{
  requests.push({command,...args});
  if(command==='open')return {...binding,pathHex:'aabb'};
  if(command==='exchange')return {reports:[{reportId:3,data:[251,16,3,11,...Array(59).fill(0)]}]};
  return {};
 }};
 try{
  const controller=await connectCompanionDevice();
  await controller.hidDevice.beginTransaction();
  assert.deepEqual(requests.find(r=>r.command==='begin').expectedDevice,binding);
  await controller.hidDevice.endTransaction();
  await controller.disconnect();
 }finally{if(oldBridge===undefined)delete globalThis.miniKeyboardDesktop;else globalThis.miniKeyboardDesktop=oldBridge;}
});

test('failed transaction end retains its lease for retry and blocks replacing it',async()=>{
 const originalFetch=globalThis.fetch,requests=[];
 let failedEnd=false;
 globalThis.fetch=async(url,options={})=>{
  const request=options.body?JSON.parse(options.body):null;
  if(request)requests.push(request);
  let result={};
  if(!request)return {ok:true,json:async()=>({available:true,token:'local-test'})};
  if(request.command==='open')result={vendorId:0x514c,productId:0x8850,productName:'Test board'};
  if(request.command==='exchange')result={reports:[{reportId:3,data:[251,16,3,11,...Array(59).fill(0)]}]};
  if(request.command==='end'&&!failedEnd){failedEnd=true;throw Error('connection interrupted');}
  return {ok:true,json:async()=>({result})};
 };
 try{
  const controller=await connectCompanionDevice(),hid=controller.hidDevice;
  await hid.beginTransaction();
  const lease=requests.find(r=>r.command==='begin').lease;
  await assert.rejects(hid.endTransaction(),/connection interrupted/);
  await assert.rejects(hid.beginTransaction(),/트랜잭션/);
  assert.equal(requests.filter(r=>r.command==='begin').length,1);
  await hid.endTransaction();
  assert.deepEqual(requests.filter(r=>r.command==='end').map(r=>r.lease),[lease,lease]);
  await hid.beginTransaction();
  assert.notEqual(requests.filter(r=>r.command==='begin').at(-1).lease,lease);
  await hid.endTransaction();
  await controller.disconnect();
 }finally{globalThis.fetch=originalFetch;}
});

test('disconnect aborts an uncertain owned transaction before closing the device',async()=>{
 const originalFetch=globalThis.fetch,requests=[];
 globalThis.fetch=async(url,options={})=>{
  const request=options.body?JSON.parse(options.body):null;
  if(request)requests.push(request);
  let result={};
  if(!request)return {ok:true,json:async()=>({available:true,token:'local-test'})};
  if(request.command==='open')result={vendorId:0x514c,productId:0x8850,productName:'Test board'};
  if(request.command==='exchange')result={reports:[{reportId:3,data:[251,16,3,11,...Array(59).fill(0)]}]};
  return {ok:true,json:async()=>({result})};
 };
 try{
  const controller=await connectCompanionDevice(),hid=controller.hidDevice;
  await hid.beginTransaction();
  const lease=requests.find(r=>r.command==='begin').lease;
  await controller.disconnect();
  assert.deepEqual(requests.slice(-2).map(r=>r.command),['abort','close']);
  assert.equal(requests.find(r=>r.command==='abort').lease,lease);
  assert.equal(hid.opened,false);
 }finally{globalThis.fetch=originalFetch;}
});

test('reconnect recovers only an expired orphan and leaves a live transaction alone',async()=>{
 const originalFetch=globalThis.fetch,requests=[];
 let expired=false;
 globalThis.fetch=async(url,options={})=>{
  const request=options.body?JSON.parse(options.body):null;
  if(request)requests.push(request);
  let result={};
  if(!request)return {ok:true,json:async()=>({available:true,token:'local-test'})};
  if(request.command==='status')result={leaseActive:true,recoveryAvailable:expired,leaseExpiresInMs:120000};
  if(request.command==='open')result={vendorId:0x514c,productId:0x8850,productName:'Test board'};
  if(request.command==='exchange')result={reports:[{reportId:3,data:[251,16,3,11,...Array(59).fill(0)]}]};
  return {ok:true,json:async()=>({result})};
 };
 try{
  await assert.rejects(connectCompanionDevice(),/120초/);
  assert.deepEqual(requests.map(r=>r.command),['status']);
  requests.length=0;expired=true;
  const controller=await connectCompanionDevice();
  assert.deepEqual(requests.slice(0,3).map(r=>r.command),['status','recover','open']);
  await controller.disconnect();
 }finally{globalThis.fetch=originalFetch;}
});

test('an already aborted transaction cannot be reported as a successful application',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options={})=>{
  const request=options.body?JSON.parse(options.body):null;let result={};
  if(!request)return {ok:true,json:async()=>({available:true,token:'local-test'})};
  if(request.command==='open')result={vendorId:0x514c,productId:0x8850,productName:'Test board'};
  if(request.command==='exchange')result={reports:[{reportId:3,data:[251,16,3,11,...Array(59).fill(0)]}]};
  if(request.command==='end')result={leaseActive:false,aborted:true,keyRestored:true};
  return {ok:true,json:async()=>({result})};
 };
 try{
  const controller=await connectCompanionDevice();
  await controller.hidDevice.beginTransaction();
  await assert.rejects(controller.hidDevice.endTransaction(),/중단.*원본/);
  await controller.disconnect();
 }finally{globalThis.fetch=originalFetch;}
});

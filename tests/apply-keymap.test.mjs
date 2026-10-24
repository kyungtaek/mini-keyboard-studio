import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile} from '../src/profile.js';
import {applyKeymap} from '../src/apply-keymap.js';
const binding={vendorId:0x514c,productId:0x8850,identity:[16,3,11],serialNumber:'board-A'};
const actualDevice={...binding,pathHex:'aabb'};
const current=()=>({layers:Array.from({length:3},()=>({mode:1,colors:Array(16).fill('#123456')}))});
const ledProfile=()=>{const p=createProfile();p.layers[0].lighting={mode:2,colors:Array(16).fill(null)};p.layers[0].lighting.colors[0]='#ff0000';return p;};
function setup(fail=false){const calls=[];const backup={raw:true};return {calls,device:{transport:'companion',hidDevice:actualDevice,identity:[16,3,11],apply:async()=>{calls.push('keys');return {changed:1,backup};},restore:async b=>{assert.equal(b,backup);calls.push('restore-keys');}},call:async(command,args)=>{calls.push(command);if(command==='status')return {connected:true,device:actualDevice,capabilities:{lightingRead:true,lightingWrite:true}};if(command==='readLighting')return current();if(command==='saveProfileLighting'){assert.equal(args.layers[0].colors[1],'#123456');assert.deepEqual(args.expectedDevice,binding);if(fail)throw Error('LED rejected');return {verified:true};}throw Error('unexpected command');}};}
test('legacy/no LED profiles use key-only path without companion calls',async()=>{const x=setup();await applyKeymap(x.device,createProfile(),{companionCall:x.call});assert.deepEqual(x.calls,['keys']);});
test('one operation preflights LED then applies keys and persists merged LED settings',async()=>{const x=setup();const result=await applyKeymap(x.device,ledProfile(),{companionCall:x.call});assert.deepEqual(x.calls,['status','readLighting','status','keys','saveProfileLighting']);assert.equal(result.lightingChanged,1);});
test('unsupported LED transport fails before key writes',async()=>{const x=setup();x.device.transport='webhid';await assert.rejects(applyKeymap(x.device,ledProfile(),{companionCall:x.call}),/LED/);assert.deepEqual(x.calls,[]);});
test('LED failure restores keys from the exact pre-apply raw backup',async()=>{const x=setup(true);await assert.rejects(applyKeymap(x.device,ledProfile(),{companionCall:x.call}),/복원/);assert.deepEqual(x.calls,['status','readLighting','status','keys','saveProfileLighting','status','restore-keys']);});

test('a different selected device is rejected before key writes',async()=>{const x=setup();x.device.hidDevice={...actualDevice,pathHex:'different'};await assert.rejects(applyKeymap(x.device,ledProfile(),{companionCall:x.call}),/연결/);assert.deepEqual(x.calls,['status']);});

test('a replacement device is never used for key rollback after LED failure',async()=>{
 const x=setup(true);let replaced=false;const call=x.call;
 x.call=async(command,args)=>{if(command==='saveProfileLighting'){replaced=true;return call(command,args);}if(command==='status'&&replaced){x.calls.push(command);return {connected:true,device:{...actualDevice,serialNumber:'board-B'}};}return call(command,args);};
 await assert.rejects(applyKeymap(x.device,ledProfile(),{companionCall:x.call}),/복원도 확인하지 못했습니다/);
 assert.equal(x.calls.includes('restore-keys'),false);
});

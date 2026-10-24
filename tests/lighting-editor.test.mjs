import test from 'node:test';
import assert from 'node:assert/strict';
import {createLightingController} from '../src/lighting-editor.js';
const board={transport:'companion',hidDevice:{opened:true,pathHex:'abcd'}};
const supported={connected:true,device:{pathHex:'abcd'},capabilities:{lightingRead:true,lightingWrite:true},leaseActive:false};

test('direct setting uses dedicated command with normalized colors and no rule mutations',async()=>{
 const calls=[];
 const controller=createLightingController({getDevice:()=>board,companionCall:async(command,args)=>{calls.push({command,args});return command==='status'?supported:{verified:true,changed:true};}});
 await controller.apply({layer:2,mode:4,colors:Array(16).fill('#AABBCC')});
 assert.deepEqual(calls.map(value=>value.command),['status','setLighting']);
 assert.deepEqual(calls[1].args,{layer:2,mode:4,colors:Array(16).fill('#aabbcc')});
});

test('invalid values fail before contacting daemon',async()=>{
 let calls=0;
 const controller=createLightingController({getDevice:()=>board,companionCall:async()=>{calls++;}});
 for(const value of [{layer:3,mode:1,colors:Array(16).fill('#123456')},{layer:0,mode:6,colors:Array(16).fill('#123456')},{layer:0,mode:1,colors:['#123456']}])await assert.rejects(controller.apply(value));
 assert.equal(calls,0);
});

test('active key lease and pending original recovery prevent direct writes',async()=>{
 for(const extra of [{leaseActive:true},{lightingRecoveryRequired:true},{capabilities:{lightingRead:true,lightingWrite:false}}]){
  const calls=[];
  const controller=createLightingController({getDevice:()=>board,companionCall:async command=>{calls.push(command);return {...supported,...extra};}});
  await assert.rejects(controller.apply({layer:0,mode:1,colors:Array(16).fill('#123456')}));
  assert.deepEqual(calls,['status']);
 }
});

test('connection replacement while awaiting status prevents applying to another board',async()=>{
 let current=board;const calls=[];
 const controller=createLightingController({getDevice:()=>current,companionCall:async command=>{calls.push(command);current={...board};return supported;}});
 await assert.rejects(controller.apply({layer:0,mode:1,colors:Array(16).fill('#123456')}),/연결/);
 assert.deepEqual(calls,['status']);
});

test('successful response requires explicit strict readback acknowledgement',async()=>{
 const controller=createLightingController({getDevice:()=>board,companionCall:async command=>command==='status'?supported:{changed:true}});
 await assert.rejects(controller.apply({layer:0,mode:1,colors:Array(16).fill('#123456')}),/확인/);
});

test('another device operation beginning during status prevents delayed apply',async()=>{
 let busy=false;const calls=[];
 const controller=createLightingController({getDevice:()=>board,getBusy:()=>busy,companionCall:async command=>{calls.push(command);busy=true;return supported;}});
 await assert.rejects(controller.apply({layer:0,mode:1,colors:Array(16).fill('#123456')}),/작업/);
 assert.deepEqual(calls,['status']);
});

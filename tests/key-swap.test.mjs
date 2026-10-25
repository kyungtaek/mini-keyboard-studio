import test from 'node:test';import assert from 'node:assert/strict';
import {createProfile} from '../src/profile.js';import {swapProfileKeys,installKeySwapDrag} from '../src/key-swap.js';

test('swap moves complete actions and LED colors on the selected layer only, for every rotation',()=>{
 for(const rotation of [0,90,180,270]){
  const p=createProfile();p.rotation=rotation;p.layers[1].actions[0]={type:'key',keys:['META','A'],label:'모두 선택'};p.layers[1].actions[15]={type:'disabled'};p.layers[1].lighting={mode:1,colors:Array(16).fill(null)};p.layers[1].lighting.colors[0]='#ff0000';p.layers[1].lighting.colors[15]='#0000ff';
  const before=structuredClone(p),next=swapProfileKeys(p,1,1,16);
  assert.deepEqual(next.layers[1].actions[15],before.layers[1].actions[0]);assert.deepEqual(next.layers[1].actions[0],before.layers[1].actions[15]);
  assert.equal(next.layers[1].lighting.colors[15],'#ff0000');assert.equal(next.layers[1].lighting.colors[0],'#0000ff');assert.equal(next.rotation,rotation);
  assert.deepEqual(next.layers[0],before.layers[0]);assert.deepEqual(next.layers[2],before.layers[2]);assert.deepEqual(next.layers[1].actions.slice(16),before.layers[1].actions.slice(16));assert.deepEqual(p,before);
 }
});
test('preserved actions use read device values; unknown actions never silently swap',()=>{
 const p=createProfile();p.layers[0].actions[0]={type:'preserve'};p.layers[0].actions[1]={type:'key',keys:['ENTER']};
 assert.throws(()=>swapProfileKeys(p,0,1,2),/먼저/);
 const next=swapProfileKeys(p,0,1,2,[{type:'key',keys:['ESC']}]);assert.deepEqual(next.layers[0].actions[1],{type:'key',keys:['ESC']});
 assert.deepEqual(next.layers[0].actions[0],{type:'key',keys:['ENTER']});assert.deepEqual(swapProfileKeys(p,0,1,1),p);
 assert.throws(()=>swapProfileKeys(p,0,1,17));
});
test('native drag swaps once and refuses external or stale-context drops',()=>{
 const handlers={},root={addEventListener:(type,fn)=>handlers[type]=fn,querySelectorAll:()=>[]};
 const key=id=>({dataset:{key:String(id)},closest(){return this;},classList:{add(){},remove(){}},contains:()=>false});
 let c={profile:createProfile(),layer:0,busy:false,recording:false},swaps=[];installKeySwapDrag({root,context:()=>c,onSwap:(...args)=>swaps.push(args)});
 const event=id=>({target:key(id),dataTransfer:{setData(){}},preventDefault(){this.prevented=true;}});
 handlers.drop(event(2));assert.equal(swaps.length,0);
 handlers.dragstart(event(1));handlers.dragover(event(2));handlers.drop(event(2));assert.deepEqual(swaps,[[1,2]]);
 handlers.dragstart(event(1));c={...c,layer:1};handlers.drop(event(3));assert.equal(swaps.length,1);
 c.busy=true;const blocked=event(1);handlers.dragstart(blocked);assert.equal(blocked.prevented,true);
});

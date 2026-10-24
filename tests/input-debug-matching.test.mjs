import test from 'node:test';
import assert from 'node:assert/strict';
import {eventChord,matchInput,appendObservation} from '../src/input-debug.js';
test('physical codes normalize independent of keyboard text and modifier order',()=>{
 assert.deepEqual(eventChord({type:'keyDown',code:'BracketLeft',key:'[',meta:true}),['META','LEFT_BRACKET']);
 assert.deepEqual(eventChord({type:'keydown',code:'KeyW',control:true,shift:true}),['CTRL','SHIFT','W']);
 for(const event of [{type:'keyUp',code:'Enter'},{type:'keyDown',code:'MetaLeft',meta:true},{type:'keyDown',code:'KeyA',isComposing:true},{type:'keyDown',code:'Unidentified'}])assert.equal(eventChord(event),null);
});
test('matches all device layers including ambiguous/right modifiers but excludes macros',()=>{
 const actions=[[{type:'key',keys:['W','RMETA']},{type:'macro',steps:[['META','W']]}],[{type:'key',keys:['META','W']}]];
 assert.deepEqual(matchInput(['META','W'],actions),[{layer:1,id:1},{layer:2,id:1}]);assert.deepEqual(matchInput(['ENTER'],actions),[]);
});
test('bounded observations retain expected position at event time',()=>{
 const list=[];for(let i=0;i<205;i++)appendObservation(list,{code:'Enter'},{id:i,layer:1});
 assert.equal(list.length,200);assert.equal(list[0].expected.id,5);assert.equal(list.at(-1).expected.id,204);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createInputDebug} from '../desktop/input-debug.mjs';

test('debug input is opt-in, blocks focused app input and sends only bounded key metadata',()=>{
 const messages=[];let focused=true,blocked=0;
 const debug=createInputDebug({isFocused:()=>focused,send:(channel,value)=>messages.push({channel,value}),now:()=>123});
 const event={preventDefault(){blocked++;}};
 const input={type:'keyDown',key:'a',code:'KeyA',control:true,shift:false,alt:true,meta:false,isAutoRepeat:true,isComposing:false,location:1,secret:'never forward'};
 debug.handle(event,input);assert.equal(blocked,0);assert.equal(messages.length,0);
 assert.throws(()=>debug.set('true'));assert.throws(()=>debug.set(1));
 assert.equal(debug.set(true),true);debug.handle(event,input);assert.equal(blocked,1);
 assert.deepEqual(messages[0],{channel:'mini:debug-input',value:{type:'keyDown',key:'a',code:'KeyA',control:true,shift:false,alt:true,meta:false,isAutoRepeat:true,isComposing:false,location:1,timestamp:123}});
 debug.handle(event,{...input,type:'keyUp',key:'x'.repeat(500),code:'y'.repeat(500),location:99,control:'yes'});
 assert.equal(messages[1].value.type,'keyUp');assert.equal(messages[1].value.key.length,64);assert.equal(messages[1].value.code.length,64);assert.equal(messages[1].value.location,0);assert.equal(messages[1].value.control,false);
 focused=false;debug.handle(event,input);assert.equal(blocked,2);assert.equal(messages.at(-1).channel,'mini:debug-paused');
 assert.equal(debug.set(true),false);focused=true;debug.handle(event,input);assert.equal(blocked,2);
});

test('lifecycle pause disarms capture and explicit rearming is required',()=>{
 const messages=[];let blocked=0;
 const debug=createInputDebug({isFocused:()=>true,send:(channel,value)=>messages.push({channel,value})});
 for(const reason of ['blur','hide','navigation','render-process-gone','quit']){
  assert.equal(debug.set(true),true);debug.pause(reason);debug.handle({preventDefault(){blocked++;}},{type:'keyDown',key:'a',code:'KeyA'});
  assert.deepEqual(messages.at(-1),{channel:'mini:debug-paused',value:{reason}});
 }
 assert.equal(blocked,0);assert.equal(messages.length,5);debug.pause('blur');assert.equal(messages.length,5);
 assert.equal(debug.set(true),true);assert.equal(debug.set(false),false);assert.deepEqual(messages.at(-1),{channel:'mini:debug-paused',value:{reason:'disabled'}});
});

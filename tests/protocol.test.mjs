import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeAction, decodeAction, outputPayload, normalizeInput, physicalActionId, validateRecords, createBackup, validateBackup } from '../src/protocol.js';

const raw = (id=1,layer=1) => { const r=new Uint8Array(64); r.set([3,250,id,layer,1,1,1,0,0,4]);r[45]=99;return r; };
test('WebHID excludes the report ID while preserving 64 data bytes',()=>{
 const payload=outputPayload([3,251,251,251]);assert.equal(payload.length,64);assert.deepEqual([...payload.slice(0,3)],[251,251,251]);
 assert.deepEqual([...normalizeInput(3,new DataView(Uint8Array.from([250,1,1,...Array(60).fill(0)]).buffer)).slice(0,4)],[3,250,1,1]);
 assert.throws(()=>outputPayload([3,252,252,15,3,0]),/model|모델/);
});
test('single key changes preserve header and encode bounded keyboard payload',()=>{
 const r=raw(25,3),encoded=encodeAction(r,{type:'key',keys:['CTRL','C']});
 assert.deepEqual([...encoded.slice(0,10)],[3,250,25,3,1,1,2,0,0,241]);assert.equal(encoded[12],6);assert.equal(r[9],4);
 assert.deepEqual(decodeAction(encoded),{type:'key',keys:['CTRL','C']});
 assert.deepEqual(encodeAction(r,{type:'preserve'}),r);
});
test('macro, modifier-only, media and mouse round trip',()=>{
 for(const action of [{type:'key',keys:['SHIFT']},{type:'macro',steps:[['CTRL','C'],['CTRL','V']]},{type:'media',key:'VOLUME_UP'},{type:'mouse',key:'SCROLL_DOWN'},{type:'disabled'}]) assert.deepEqual(decodeAction(encodeAction(raw(),action)),action);
 assert.throws(()=>encodeAction(raw(),{type:'macro',steps:Array(15).fill(['A'])}),/14|길/);
});
test('keyboard records preserve existing vendor timing mode',()=>{
 const r=raw();const encoded=encodeAction(r,{type:'key',keys:['B']});assert.equal(encoded[5],1);
});
test('physical grid matches column-major manufacturer layout',()=>{
 assert.deepEqual(Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>physicalActionId(r,c))),[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]);
});
test('backup requires exact complete layer, action and layer headers plus digest',async()=>{
 const layers=Array.from({length:3},(_,l)=>Array.from({length:25},(_,i)=>raw(i+1,l+1)));
 validateRecords(layers);const b=await createBackup(layers,[16,3,11]);const parsed=await validateBackup(b,[16,3,11]);assert.equal(parsed.length,3);
 const damaged=structuredClone(b);damaged.layers[0][0]=damaged.layers[0][0].slice(0,-2)+'ff';await assert.rejects(validateBackup(damaged,[16,3,11]),/해시|digest/);
 await assert.rejects(validateBackup(b,[15,3,0]),/모델/);
 const missing=layers.map(x=>x.slice());missing[2].pop();assert.throws(()=>validateRecords(missing),/25/);
 const wrong=layers.map(x=>x.map(y=>y.slice()));wrong[1][2][3]=1;assert.throws(()=>validateRecords(wrong),/레이어/);
});
test('shorter assignments clear all inactive entries before the writer primes 14 slots',()=>{
 const r=raw(19);r[6]=5;r[9]=241;r[12]=242;r[15]=243;r[18]=244;r[21]=68;r[49]=77;
 for(const action of [{type:'key',keys:['META','LEFT_BRACKET']},{type:'key',keys:['CTRL','UP']},{type:'media',key:'VOLUME_UP'},{type:'disabled'}]){
  const encoded=encodeAction(r,action);const end=7+encoded[6]*3;
  assert.ok(encoded.slice(end,49).every(value=>value===0));assert.equal(encoded[49],77);
  assert.deepEqual(decodeAction(encoded),action);
 }
 assert.deepEqual(encodeAction(r,{type:'preserve'}),r);
});

test('all eight modifier tokens and combinations use independent vendor codes',()=>{
 const modifiers={CTRL:241,SHIFT:242,ALT:243,META:244,RCTRL:245,RSHIFT:246,RALT:247,RMETA:248};
 for(const [modifier,code] of Object.entries(modifiers)){
  const source=raw();source.fill(243,7,49);
  const record=encodeAction(source,{type:'key',keys:[modifier,'LEFT_BRACKET']});
  assert.deepEqual([...record.slice(7,13)],[0,0,code,0,0,47]);
  assert.ok(record.slice(13,49).every(byte=>byte===0));
 }
 const record=encodeAction(raw(),{type:'key',keys:['CTRL','SHIFT','ALT','META','A']});
 assert.deepEqual(Array.from({length:5},(_,i)=>record[9+i*3]),[241,242,243,244,4]);
});

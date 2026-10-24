import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceActionId,profileActionId,toProfileActions,toDeviceActions} from '../src/action-mapping.js';
import {gridActionIds,MODELS,actionCount} from '../src/models.js';
test('2350 physical row-major measurement resolves to matching rotated wire positions without extra rotation',()=>{
 // Explicit top-left->bottom-right press order and independently read wire data.
 const measuredTailWire=[2,6,10,14,1,5,9,13];
 assert.deepEqual(measuredTailWire.map(id=>profileActionId('mini-16x3',id)),gridActionIds('mini-16x3',270).flat().slice(-8));
});
test('profile IDs, wire IDs and encoders remain identical for every supported model',()=>{
 for(const model of MODELS)for(let id=1;id<=actionCount(model);id++){
  assert.equal(deviceActionId(model.id,id),id);assert.equal(profileActionId(model.id,id),id);
 }
});
test('I/O boundaries copy action arrays without changing order, values or originals',()=>{
 const actions=Array.from({length:25},(_,i)=>({key:`slot-${i+1}`}));
 const wire=toDeviceActions('mini-16x3',actions),logical=toProfileActions('mini-16x3',wire);
 assert.deepEqual(wire,actions);assert.deepEqual(logical,actions);assert.notEqual(wire,actions);
});

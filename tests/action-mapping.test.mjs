import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceActionId,profileActionId,toProfileActions,toDeviceActions,hasCalibratedMapping} from '../src/action-mapping.js';
import {gridActionIds} from '../src/models.js';
test('mini16 wire IDs compensate the reported CCW90 placement offset',()=>{
 assert.deepEqual(Array.from({length:16},(_,i)=>deviceActionId('mini-16x3',i+1)),[13,9,5,1,14,10,6,2,15,11,7,3,16,12,8,4]);
 // At knobs top the real firmware grid is row-major. Inverting its IDs
 // yields the logical keys intended by the editor at 270 degrees.
 const physicalTopWire=Array.from({length:16},(_,i)=>i+1);
 assert.deepEqual(physicalTopWire.map(id=>profileActionId('mini-16x3',id)),gridActionIds('mini-16x3',270).flat());
});
test('mapping is bijective, leaves encoders and other device models unchanged',()=>{
 for(let id=1;id<=25;id++)assert.equal(profileActionId('mini-16x3',deviceActionId('mini-16x3',id)),id);
 for(let id=17;id<=25;id++)assert.equal(deviceActionId('mini-16x3',id),id);
 for(let id=1;id<=12;id++)assert.equal(deviceActionId('mini-6x2',id),id);
});
test('read/write arrays round trip without altering values or inputs',()=>{
 const logical=Array.from({length:25},(_,i)=>({key:`logical-${i+1}`}));
 const wire=toDeviceActions('mini-16x3',logical);
 assert.equal(wire[12],logical[0]);assert.equal(wire[0],logical[3]);
 assert.deepEqual(toProfileActions('mini-16x3',wire),logical);
 assert.equal(logical[0].key,'logical-1');
});

test('uncalibrated variants retain their previous wire order',()=>{
 const values=Array.from({length:25},(_,i)=>i);
 assert.deepEqual(toDeviceActions('mini-16x3',values,{calibrated:false}),values);
 assert.deepEqual(toProfileActions('mini-16x3',values,{calibrated:false}),values);
});

test('physical calibration requires the exact observed identity',()=>{
 assert.equal(hasCalibratedMapping({vid:0x514c,pid:0x8850,identity:[16,3,11]}),true);
 for(const value of [{vid:0x1189,pid:0x8850,identity:[16,3,11]},{vid:0x514c,pid:0x8851,identity:[16,3,11]},{vid:0x514c,pid:0x8850,identity:[16,3,12]},{}])assert.equal(hasCalibratedMapping(value),false);
});

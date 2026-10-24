import test from 'node:test';
import assert from 'node:assert/strict';
import {connectionView} from '../desktop/connection-status.mjs';
test('connection events never claim an unverified device is connected or include device data',()=>{
 assert.deepEqual(connectionView({connected:true,connectionState:'unknown',device:{serialNumber:'private'},connectionRevision:2}),{connected:false,connectionState:'unknown',connectionRevision:2,connectionError:null});
 assert.equal(connectionView({connected:false,connectionState:'disconnected',connectionRevision:3}).connected,false);
 assert.equal(connectionView({connected:true,connectionState:'connected'}).connected,true);
 assert.equal(connectionView({connectionRevision:-1,connectionError:'x'.repeat(400)}).connectionError.length,256);
});

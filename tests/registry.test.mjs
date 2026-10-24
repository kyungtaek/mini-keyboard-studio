import test from 'node:test';import assert from 'node:assert/strict';
import {matchFirmware,isMiniKeyboard,deviceFilters} from '../src/registry.js';
test('driver routing uses full identity rather than product appearance or VID/PID alone',()=>{
 assert.equal(matchFirmware(0x514c,0x8850,[16,3,11]).modelId,'mini-16x3');
 assert.equal(matchFirmware(0x1189,0x8842,[6,2,11]).modelId,'mini-6x2');
 assert.equal(matchFirmware(0x514c,0x8850,[3,1,0]).writable,false);
 assert.equal(matchFirmware(0x514c,0x8850,[12,4,11]).modelId,'mini-12x4');
 assert.equal(isMiniKeyboard(0x05ac,0x022c),false);
 assert.equal(matchFirmware(0x05ac,0x022c,[16,3,11]).writable,false);
 assert.equal(deviceFilters().every(f=>f.usagePage===0xff00&&f.usage===1),true);
});

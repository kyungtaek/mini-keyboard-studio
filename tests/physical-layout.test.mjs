import test from 'node:test';
import assert from 'node:assert/strict';
import {gridActionIds} from '../src/models.js';
// These are logical UI positions, not raw USB action IDs. Physical compensation
// is tested separately at the transport boundary in action-mapping/device tests.
test('270 degree editor preserves the established logical key arrangement',()=>{
 assert.deepEqual(gridActionIds('mini-16x3',270).flat(),[4,8,12,16,3,7,11,15,2,6,10,14,1,5,9,13]);
});

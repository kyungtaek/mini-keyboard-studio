import test from 'node:test';
import assert from 'node:assert/strict';
import {gridActionIds} from '../src/models.js';
// User measurement 2026-10-24 23:21:39..43, rotated 270 degrees.
// User pressed displayed IDs 16 down to 1; supplied tail contains nine chords.
// Every chord has exactly one layer-1 match. Modifiers are not separate presses.
const measuredTail=[15,2,6,10,14,1,5,9,13];
test('270 degree board positions match the nine observed device action IDs',()=>{
 const positions=gridActionIds('mini-16x3',270).flat();
 assert.deepEqual(positions.slice(-9),measuredTail);
});

// Full second pass saved locally before installing the fix, 23:23:02..15.
test('all sixteen measured positions agree with the corrected 270 degree board',()=>{
 assert.deepEqual(gridActionIds('mini-16x3',270).flat(),[4,8,12,16,3,7,11,15,2,6,10,14,1,5,9,13]);
});

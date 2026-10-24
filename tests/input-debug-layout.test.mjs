import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnosticLayout,diagnosticPosition} from '../src/input-debug-layout.js';
import {gridActionIds} from '../src/models.js';
test('probe uses same key grid as editor at all four rotations and exposes knob side',()=>{
 for(const [rotation,side,order] of [[0,'right',[1,2,3]],[90,'bottom',[3,2,1]],[180,'left',[3,2,1]],[270,'top',[1,2,3]]]){
  const layout=diagnosticLayout('mini-16x3',rotation);
  assert.deepEqual(layout.grid,gridActionIds('mini-16x3',rotation));
  assert.equal(layout.knobSide,side);assert.deepEqual(layout.knobs,order);
 }
});
test('device IDs remain stable while displayed row/column follows rotation',()=>{
 assert.deepEqual(diagnosticPosition('mini-16x3',0,1),{row:1,column:1});
 assert.deepEqual(diagnosticPosition('mini-16x3',90,1),{row:1,column:4});
 assert.deepEqual(diagnosticPosition('mini-16x3',180,1),{row:4,column:4});
 assert.deepEqual(diagnosticPosition('mini-16x3',270,1),{row:4,column:1});
 assert.equal(diagnosticPosition('mini-16x3',270,18),null);
});

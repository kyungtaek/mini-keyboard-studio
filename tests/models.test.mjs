import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, getModel, actionCount, gridActionIds } from '../src/models.js';

test('catalog distinguishes the verified device from unverified CH57x layouts', () => {
  assert.deepEqual(MODELS.map(model => [model.id, model.keys, model.encoders, model.protocol, model.verified]), [
    ['mini-16x3', 16, 3, 'fd65', true],
    ['mini-3x1', 3, 1, 'ch57x', false],
    ['mini-6x1', 6, 1, 'ch57x', false],
    ['mini-6x2', 6, 2, 'ch57x', false],
    ['mini-12x2', 12, 2, 'ch57x', false],
    ['mini-12x3', 12, 3, 'ch57x', false],
    ['mini-12x4', 12, 4, 'ch57x', false],
    ['mini-9x2', 9, 2, 'ch57x', false],
  ]);
  assert.equal(actionCount('mini-3x1'), 6);
  assert.equal(actionCount(getModel('mini-16x3')), 25);
  assert.throws(() => getModel('unknown-model'), /모델/);
});

test('base grids preserve manufacturer physical IDs', () => {
  assert.deepEqual(gridActionIds('mini-16x3'), [[4, 8, 12, 16], [3, 7, 11, 15], [2, 6, 10, 14], [1, 5, 9, 13]]);
  assert.deepEqual(gridActionIds('mini-3x1'), [[1, 2, 3]]);
  assert.deepEqual(gridActionIds('mini-6x2'), [[1, 2, 3], [4, 5, 6]]);
  assert.equal(gridActionIds({ id: 'prototype', keys: 5, encoders: 1, rows: 2, columns: 3 }), null);
});

test('clockwise rotations move physical IDs without changing or duplicating them', () => {
  assert.deepEqual(gridActionIds('mini-6x1', 90), [[4, 1], [5, 2], [6, 3]]);
  assert.deepEqual(gridActionIds('mini-6x1', 270), [[3, 6], [2, 5], [1, 4]]);
  assert.deepEqual(gridActionIds('mini-16x3', 90), [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]);
  for (const model of MODELS) {
    for (const rotation of [0, 90, 180, 270]) {
      const ids = gridActionIds(model, rotation).flat();
      assert.equal(new Set(ids).size, model.keys);
      assert.deepEqual(ids.toSorted((a, b) => a - b), Array.from({ length: model.keys }, (_, index) => index + 1));
    }
  }
  assert.throws(() => gridActionIds('mini-3x1', -90), /회전/);
  assert.throws(() => gridActionIds('mini-3x1', '90'), /회전/);
});

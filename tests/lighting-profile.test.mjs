import test from 'node:test';
import assert from 'node:assert/strict';
import { LED_PALETTE, normalizeLighting, resolveLighting } from '../src/lighting-profile.js';
import { createProfile, validateProfile, encodeShare, decodeShare, saveToLibrary, loadLibrary } from '../src/profile.js';

test('palette has 16 exact choices and lighting patches clone canonical values', () => {
  assert.deepEqual(LED_PALETTE, ['#ff0000', '#ff8030', '#ffff30', '#00ff00', '#00ffff', '#0000ff', '#800080', '#8b0000', '#ffa500', '#ffff96', '#7dff00', '#008b8b', '#00008b', '#ff00ff', '#ff6666', '#ffc864']);
  assert.equal(normalizeLighting(undefined, 'mini-16x3'), null);
  assert.equal(normalizeLighting(null, 'mini-3x1'), null);
  const patch = { mode: null, colors: Array(16).fill(null) };
  patch.colors[0] = '#FF8030';
  const normalized = normalizeLighting(patch, 'mini-16x3');
  assert.equal(normalized.colors[0], '#ff8030');
  normalized.colors[1] = '#ff0000';
  assert.equal(patch.colors[1], null);
  for (const mode of [0, 1, 2, 3, 4, 5]) assert.equal(normalizeLighting({ ...patch, mode }, 'mini-16x3').mode, mode);
});

test('lighting rejects unsupported colors, models, modes, properties and incomplete arrays', () => {
  const valid = { mode: 1, colors: Array(16).fill(null) };
  for (const patch of [
    { ...valid, mode: -1 }, { ...valid, mode: 6 }, { ...valid, mode: '1' },
    { ...valid, colors: Array(15).fill(null) }, { ...valid, colors: Array(16) },
    { ...valid, colors: Array(16).fill('#123456') }, { ...valid, colors: Array(16).fill('#000000') },
    { ...valid, colors: Array(16).fill(0) }, { ...valid, extra: true },
    { colors: valid.colors }, { mode: 1 }, Object.create(valid),
    JSON.parse('{"mode":1,"colors":[],"__proto__":{"polluted":true}}'),
  ]) assert.throws(() => normalizeLighting(patch, 'mini-16x3'), Error);
  assert.throws(() => normalizeLighting(valid, 'mini-3x1'), /지원/);
  assert.equal({}.polluted, undefined);
});

test('resolution preserves untouched device settings, including readable colors outside the palette', () => {
  const current = { mode: 9, colors: Array(16).fill('#123456') };
  const patch = { mode: null, colors: Array(16).fill(null) }; patch.colors[5] = '#ff0000';
  const result = resolveLighting(patch, current, 'mini-16x3');
  assert.equal(result.mode, 9);
  assert.equal(result.colors[0], '#123456');
  assert.equal(result.colors[5], '#ff0000');
  assert.equal(current.colors[5], '#123456');
  assert.deepEqual(resolveLighting(null, current, 'mini-16x3'), current);
  assert.notEqual(resolveLighting(null, current, 'mini-16x3').colors, current.colors);
  assert.equal(resolveLighting({ ...patch, mode: 0 }, current).mode, 0);
  assert.throws(() => resolveLighting(patch, { mode: 1, colors: [] }), Error);
});

test('v4 lighting, function labels and rotation persist in JSON, fragment and local library', () => {
  const profile = createProfile('LED 키맵 💡'); profile.rotation = 270;
  profile.layers[0].lighting = { mode: 2, colors: [...LED_PALETTE] };
  profile.layers[1].lighting = { mode: null, colors: Array(16).fill(null) }; profile.layers[1].lighting.colors[3] = '#ff0000';
  profile.layers[0].actions[3] = { type: 'key', keys: ['CTRL', 'C'], label: '복사' };
  assert.deepEqual(validateProfile(JSON.parse(JSON.stringify(profile))), profile);
  assert.deepEqual(decodeShare(encodeShare(profile)), profile);
  const values = new Map(); const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  saveToLibrary(profile, storage); assert.deepEqual(loadLibrary(storage), [profile]);
  const compact = createProfile('지원 전 모델', 'mini-3x1'); compact.layers[0].lighting = { mode: 1, colors: Array(3).fill(null) };
  assert.throws(() => validateProfile(compact), /지원/);
});

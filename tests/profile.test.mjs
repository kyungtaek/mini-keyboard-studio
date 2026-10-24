import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createProfile, validateProfile, actionLabel, encodeShare, decodeShare, saveToLibrary, loadLibrary, deleteFromLibrary } from '../src/profile.js';

const libraryKey = 'mini-keyboard-studio.library.v1';
function memoryStorage(initial = null) {
  const values = new Map(initial === null ? [] : [[libraryKey, initial]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}
function withAction(action) {
  const profile = createProfile();
  profile.layers[0].actions[0] = action;
  return profile;
}

test('new profiles preserve every device slot and isolate nested values', () => {
  const first = createProfile('스프린트 🎮');
  const second = createProfile();
  assert.equal(first.name, '스프린트 🎮');
  assert.equal(first.format, 'mini-keyboard-studio');
  assert.equal(first.version, 4);
  assert.equal(Object.hasOwn(first, 'applicationId'), false);
  assert.ok(first.layers.every(layer => layer.lighting === null));
  assert.equal(first.modelId, 'mini-16x3');
  assert.equal(first.rotation, 0);
  assert.equal(first.layers.length, 3);
  assert.equal(first.layers.flatMap(layer => layer.actions).length, 75);
  assert.ok(first.layers.every(layer => layer.actions.every(action => action.type === 'preserve')));
  first.layers[0].actions[0].type = 'disabled';
  assert.equal(first.layers[0].actions[1].type, 'preserve');
  assert.equal(second.layers[0].actions[0].type, 'preserve');
  assert.notEqual(first.id, second.id);
  assert.ok(Number.isFinite(Date.parse(first.updatedAt)));
});

test('validation clones profiles and canonicalizes supported chords', () => {
  const input = withAction({ type: 'key', keys: ['c', 'ctrl'] });
  const result = validateProfile(input);
  assert.deepEqual(result.layers[0].actions[0], { type: 'key', keys: ['CTRL', 'C'] });
  result.layers[0].actions[0].keys.push('SHIFT');
  assert.deepEqual(input.layers[0].actions[0].keys, ['c', 'ctrl']);
  for (const action of [
    { type: 'disabled' }, { type: 'preserve' }, { type: 'key', keys: ['SHIFT'] },
    { type: 'key', keys: ['RMETA', 'F24'] },
    { type: 'macro', steps: [['CTRL', 'C'], ['CTRL', 'V']] },
    { type: 'media', key: 'VOLUME_UP' }, { type: 'mouse', key: 'LEFT_CLICK' },
  ]) assert.deepEqual(validateProfile(withAction(action)).layers[0].actions[0], action);
});

test('validation rejects unsupported versions, incomplete arrays and unsafe properties', () => {
  const mutations = [
    value => { value.version = 5; }, value => { value.format = 'other'; },
    value => { value.layers.pop(); }, value => { value.layers[0].actions.pop(); },
    value => { value.layers[0].actions = Array(25); },
    value => { value.extra = 'unknown'; }, value => { value.layers[0].extra = true; },
    value => { value.name = ' '; }, value => { value.name = 'x'.repeat(81); },
    value => { value.description = 'x'.repeat(1001); }, value => { value.id = 'x'.repeat(101); },
    value => { value.updatedAt = 'yesterday'; },
    value => { Object.setPrototypeOf(value, { injected: true }); },
    value => { value.layers[0].actions[0] = JSON.parse('{"type":"preserve","__proto__":{"polluted":true}}'); },
  ];
  for (const mutate of mutations) {
    const value = createProfile(); mutate(value);
    assert.throws(() => validateProfile(value), Error);
  }
  assert.equal({}.polluted, undefined);
});

function legacyProfile() {
  return {
    format: 'mini-keyboard-studio', version: 1, id: 'legacy-profile', name: '기존 키맵', description: 'v1 가져오기', updatedAt: '2026-10-24T00:00:00.000Z',
    layers: Array.from({ length: 3 }, (_, index) => ({ name: `레이어 ${index + 1}`, actions: Array.from({ length: 25 }, () => ({ type: 'preserve' })) })),
  };
}

test('strict v1 profiles migrate to the default model without reordering actions', () => {
  const legacy = legacyProfile();
  legacy.layers[2].actions[16] = { type: 'key', keys: ['F13'] };
  const migrated = validateProfile(legacy);
  assert.equal(migrated.version, 4);
  assert.equal(migrated.modelId, 'mini-16x3');
  assert.equal(migrated.rotation, 0);
  assert.deepEqual(migrated.layers.map(({ lighting, ...layer }) => layer), legacy.layers);
  assert.ok(migrated.layers.every(layer => layer.lighting === null));
  assert.equal(legacy.version, 1);
  assert.equal(legacy.modelId, undefined);
  assert.throws(() => validateProfile({ ...legacy, rotation: 90 }), Error);
  const oldShare = '#keymap=' + Buffer.from(JSON.stringify(legacy)).toString('base64url');
  assert.deepEqual(decodeShare(oldShare), migrated);
  const storage = memoryStorage(JSON.stringify([legacy]));
  assert.deepEqual(loadLibrary(storage), [migrated]);
  assert.equal(JSON.parse(storage.getItem(libraryKey))[0].version, 1);
});

test('every shipped sample validates as a default-model v4 profile', async () => {
  const index = JSON.parse(await readFile(new URL('../presets/index.json', import.meta.url), 'utf8'));
  assert.ok(index.length > 0);
  for (const sample of index) {
    const raw = JSON.parse(await readFile(new URL(`../presets/${sample.file}`, import.meta.url), 'utf8'));
    const normalized = validateProfile(raw);
    assert.equal(normalized.version, 4, sample.file);
    assert.equal(normalized.modelId, 'mini-16x3', sample.file);
    assert.equal(normalized.rotation, 0, sample.file);
    assert.deepEqual(normalized.layers.map(({ lighting, ...layer }) => layer), raw.layers.map(({ lighting, ...layer }) => layer), sample.file);
    assert.equal(Object.hasOwn(normalized, 'applicationId'), false, sample.file);
  }
});

test('model action counts and rotations validate in v2', () => {
  const compact = createProfile('작은 키보드', 'mini-3x1');
  assert.equal(compact.modelId, 'mini-3x1');
  assert.ok(compact.layers.every(layer => layer.actions.length === 6));
  compact.layers[0].actions[0] = { type: 'key', keys: ['A'] };
  compact.layers[0].actions[5] = { type: 'media', key: 'VOLUME_UP' };
  compact.rotation = 270;
  assert.deepEqual(validateProfile(compact).layers, compact.layers);
  for (const rotation of [-90, 45, 360, '90', null]) assert.throws(() => validateProfile({ ...compact, rotation }), /회전/);
  assert.throws(() => validateProfile({ ...compact, modelId: 'unknown-model' }), /모델/);
  const wrongCount = structuredClone(compact); wrongCount.layers[0].actions.push({ type: 'preserve' });
  assert.throws(() => validateProfile(wrongCount), /동작/);
  const missingRotation = { ...compact }; delete missingRotation.rotation;
  assert.throws(() => validateProfile(missingRotation), Error);
});

test('model and rotation persist through JSON, sharing and the library', () => {
  const profile = createProfile('세로 배치 🎛️', 'mini-12x4');
  profile.rotation = 90;
  profile.layers[1].actions[23] = { type: 'key', keys: ['CTRL', 'S'] };
  assert.deepEqual(validateProfile(JSON.parse(JSON.stringify(profile))), profile);
  assert.deepEqual(decodeShare(encodeShare(profile)), profile);
  const storage = memoryStorage(); saveToLibrary(profile, storage);
  assert.deepEqual(loadLibrary(storage), [profile]);
});

test('validation rejects ambiguous chords and overlong macros', () => {
  for (const action of [
    { type: 'key', keys: [] }, { type: 'key', keys: [''] },
    { type: 'key', keys: ['A', 'B'] }, { type: 'key', keys: ['CTRL', 'ctrl', 'C'] },
    { type: 'key', keys: ['EXECUTE_CODE'] }, { type: 'key', keys: ['C'], raw: [1] },
    { type: 'macro', steps: [] }, { type: 'macro', steps: Array.from({ length: 15 }, () => ['A']) },
    { type: 'macro', steps: Array.from({ length: 8 }, () => ['CTRL', 'A']) },
    { type: 'media', key: 'LAUNCH_BROWSER' }, { type: 'mouse', key: 'MOVE_TO' },
    { type: 'preserve', payload: [1] }, { type: 'shell', command: 'anything' },
  ]) assert.throws(() => validateProfile(withAction(action)), Error);
  assert.equal(validateProfile(withAction({ type: 'macro', steps: Array.from({ length: 14 }, () => ['A']) })).layers[0].actions[0].steps.length, 14);
});

test('modifier-only macro steps include their boundary entry in the 14-entry limit', () => {
  const sevenSteps = Array.from({ length: 7 }, () => ['SHIFT']);
  assert.deepEqual(validateProfile(withAction({ type: 'macro', steps: sevenSteps })).layers[0].actions[0], { type: 'macro', steps: sevenSteps });
  assert.throws(() => validateProfile(withAction({ type: 'macro', steps: [...sevenSteps, ['SHIFT']] })), /14/);
  assert.deepEqual(validateProfile(withAction({ type: 'key', keys: ['SHIFT'] })).layers[0].actions[0], { type: 'key', keys: ['SHIFT'] });
});

test('timestamps reject impossible dates and normalize explicit ISO offsets', () => {
  for (const updatedAt of ['1', '2026-02-30T00:00:00.000Z', '2026-13-01T00:00:00Z', '2026-01-01T24:00:00Z']) {
    const profile = createProfile(); profile.updatedAt = updatedAt;
    assert.throws(() => validateProfile(profile), /날짜/);
  }
  const profile = createProfile(); profile.updatedAt = '2026-10-24T09:00:00+09:00';
  assert.equal(validateProfile(profile).updatedAt, '2026-10-24T00:00:00.000Z');
});

test('module import does not access browser storage', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('must stay lazy'); } });
  try {
    const imported = await import('../src/profile.js?storage-import-check');
    assert.equal(typeof imported.createProfile, 'function');
    assert.throws(() => imported.loadLibrary(), /브라우저 저장소/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('labels describe every editable action without assuming original mappings', () => {
  assert.match(actionLabel({ type: 'preserve' }), /유지/);
  assert.match(actionLabel({ type: 'disabled' }), /없음|비활성/);
  assert.equal(actionLabel({ type: 'key', keys: ['CTRL', 'C'] }), 'Ctrl + C');
  assert.match(actionLabel({ type: 'macro', steps: [['C'], ['V']] }), /C.*V/);
  assert.match(actionLabel({ type: 'media', key: 'VOLUME_UP' }), /볼륨/);
  assert.match(actionLabel({ type: 'mouse', key: 'LEFT_CLICK' }), /클릭/);
});

test('share fragments round-trip Unicode entirely inside the fragment', () => {
  const profile = createProfile('게임 🎮 / 한글');
  profile.description = '로컬 키맵 — Shift로 달리기';
  profile.layers[0].actions[0] = { type: 'key', keys: ['SHIFT'] };
  const hash = encodeShare(profile);
  assert.match(hash, /^#keymap=[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeShare(hash), profile);
});

test('share decoding rejects corrupt, oversized and unsupported payloads', () => {
  for (const hash of ['', '#other=abc', '#keymap=%invalid', '#keymap=A', '#keymap=_w', '#keymap=eyJmb28iOjF9', '#keymap=' + 'A'.repeat(24000)]) {
    assert.throws(() => decodeShare(hash), Error);
  }
  const profile = createProfile('x'.repeat(80));
  profile.layers.forEach(layer => layer.actions.fill({ type: 'macro', steps: Array.from({ length: 14 }, () => ['PRINT_SCREEN']) }));
  assert.throws(() => encodeShare(profile), /길|크|공유/);
});

test('library stores, replaces, clones and deletes validated profiles', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadLibrary(storage), []);
  const first = createProfile('첫 번째');
  saveToLibrary(first, storage);
  saveToLibrary(createProfile('두 번째'), storage);
  first.name = '수정'; saveToLibrary(first, storage);
  const loaded = loadLibrary(storage);
  assert.equal(loaded.length, 2);
  assert.equal(loaded.find(value => value.id === first.id).name, '수정');
  loaded[0].name = '외부 변경';
  assert.ok(loadLibrary(storage).every(value => value.name !== '외부 변경'));
  deleteFromLibrary(first.id, storage);
  assert.equal(loadLibrary(storage).length, 1);
});

test('corrupt library data never gets silently overwritten', () => {
  for (const raw of ['not json', '{}', '[{"version":2}]']) {
    const storage = memoryStorage(raw);
    assert.throws(() => loadLibrary(storage), /보관함|저장/);
    assert.throws(() => saveToLibrary(createProfile(), storage), /보관함|저장/);
    assert.throws(() => deleteFromLibrary('anything', storage), /보관함|저장/);
    assert.equal(storage.getItem(libraryKey), raw);
  }
});

test('library rejects duplicates and a 51st profile while allowing replacement', () => {
  const first = createProfile();
  assert.throws(() => loadLibrary(memoryStorage(JSON.stringify([first, first]))), /보관함|중복/);
  const profiles = Array.from({ length: 50 }, () => createProfile());
  const storage = memoryStorage(JSON.stringify(profiles));
  assert.throws(() => saveToLibrary(createProfile(), storage), /50/);
  profiles[0].name = '교체'; saveToLibrary(profiles[0], storage);
  assert.equal(loadLibrary(storage).length, 50);
});

test('quota and unavailable storage failures explain recovery', () => {
  const storage = memoryStorage();
  storage.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  assert.throws(() => saveToLibrary(createProfile(), storage), /용량|공간/);
  assert.throws(() => loadLibrary({ getItem() { throw new Error('denied'); } }), /브라우저|보관함|저장/);
});

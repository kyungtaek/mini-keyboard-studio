import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfile, validateProfile, encodeShare, decodeShare } from '../src/profile.js';

function legacyProfile(version) {
  const value = createProfile('이전 키맵');
  value.version = version;
  for (const layer of value.layers) delete layer.lighting;
  if (version === 1) { delete value.modelId; delete value.rotation; }
  else value.rotation = 270;
  if (version === 3) value.applicationId = 'vscode-mac';
  return value;
}

test('v1, v2 and v3 migration strips app bindings while retaining action labels and rotation', () => {
  for (const version of [1, 2, 3]) {
    const old = legacyProfile(version);
    old.layers[0].actions[0] = { type: 'key', keys: ['META', 'P'], label: '파일 빠르게 열기 🎯' };
    const oldShare = '#keymap=' + Buffer.from(JSON.stringify(old)).toString('base64url');
    const migrated = decodeShare(oldShare);
    assert.equal(migrated.version, 4);
    assert.equal(Object.hasOwn(migrated, 'applicationId'), false);
    assert.equal(migrated.rotation, version === 1 ? 0 : 270);
    assert.deepEqual(migrated.layers[0].actions[0], old.layers[0].actions[0]);
    assert.ok(migrated.layers.every(layer => layer.lighting === null));
    assert.deepEqual(decodeShare(encodeShare(migrated)), migrated);
  }
});

test('v3 app IDs are validated before being discarded and never inferred from sample IDs', () => {
  const old = legacyProfile(3);
  assert.equal(Object.hasOwn(validateProfile(old), 'applicationId'), false);
  for (const applicationId of ['../../bad', '', 'UPPER', 'x'.repeat(101), 1, {}]) {
    assert.throws(() => validateProfile({ ...old, applicationId }), /앱 ID/);
  }
  old.applicationId = null;
  assert.equal(Object.hasOwn(validateProfile(old), 'applicationId'), false);
  delete old.applicationId;
  assert.throws(() => validateProfile(old), Error);
  const sample = legacyProfile(1); sample.id = 'sample-vscode-mac';
  assert.equal(Object.hasOwn(validateProfile(sample), 'applicationId'), false);
  for (const version of [1, 2]) assert.throws(() => validateProfile({ ...legacyProfile(version), applicationId: 'vscode-mac' }), Error);
});

test('v4 forbids app associations, requires lighting fields and keeps bounded function labels', () => {
  const profile = createProfile();
  assert.equal(profile.version, 4);
  assert.throws(() => validateProfile({ ...profile, applicationId: null }), Error);
  delete profile.layers[0].lighting;
  assert.throws(() => validateProfile(profile), Error);
  profile.layers[0].lighting = null;
  profile.layers[0].actions[0] = { type: 'key', keys: ['A'], label: 'x'.repeat(81) };
  assert.throws(() => validateProfile(profile), /기능 이름/);
});

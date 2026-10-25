import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import * as registry from '../src/shortcuts.js';

const index = JSON.parse(await readFile(new URL('../data/shortcuts/index.json', import.meta.url), 'utf8'));
const systemData = JSON.parse(await readFile(new URL('../data/shortcuts/system-mac.json', import.meta.url), 'utf8'));
const datasetRoot = new URL('../data/shortcuts/', import.meta.url);
async function localFetcher(url) {
  const target = new URL(url);
  assert.equal(new URL('.', target).href, datasetRoot.href, 'catalog only reads its local data directory');
  return new Response(await readFile(target, 'utf8'), { status: 200 });
}
function fixtureFetcher(records, patchIndex = value => value) {
  const data = { ...structuredClone(systemData), records, setupInstructions: ['앱 설정을 확인하세요.'] };
  const manifest = patchIndex(structuredClone(index));
  return async url => new Response(JSON.stringify(new URL(url).pathname.endsWith('/index.json') ? manifest : data), { status: 200 });
}
function record(id, patch = {}) {
  return { id, label: '복사', layer: 1, actionId: 1, action: { type: 'key', keys: ['META', 'C'] }, status: 'published-default', sourceUrl: 'https://support.apple.com/en-us/102650', notes: '편집 필드', ...patch };
}
const items = catalog => catalog.groups.flatMap(group => group.items);

test('unspecified application loads the system catalog with useful navigation and media', async () => {
  const { loadShortcutCatalog } = registry;
  for (const appId of [undefined, null, '']) {
    const catalog = await loadShortcutCatalog(appId, { fetcher: localFetcher });
    assert.equal(catalog.application.id, 'system');
    assert.deepEqual(catalog.groups.map(group => group.name), ['기본 탐색', 'Safari / 창 관리', '공통 편집 / 미디어']);
    assert.ok(items(catalog).some(item => item.label === 'Enter' && item.action.keys?.[0] === 'ENTER'));
    assert.ok(items(catalog).some(item => item.action.type === 'media' && item.action.key === 'VOLUME_UP'));
  }
});

test('each application registry entry resolves only its shipped dataset and returns assignable actions', async () => {
  const { APPLICATIONS, loadShortcutCatalog } = registry;
  assert.equal(APPLICATIONS.length, 9);
  assert.equal(new Set(APPLICATIONS.map(app => app.id)).size, 9);
  for (const application of APPLICATIONS) {
    assert.ok(Array.isArray(application.bundleIds));
    const catalog = await loadShortcutCatalog(application.id, { fetcher: localFetcher });
    assert.equal(catalog.application.id, application.id);
    assert.ok(catalog.groups.length > 0);
    const raw = JSON.parse(await readFile(new URL(application.datasetFile, datasetRoot), 'utf8'));
    for (const item of items(catalog)) {
      assert.ok(raw.records.some(record => record.id === item.id && record.label === item.label));
      assert.ok(['key', 'macro', 'mouse', 'media'].includes(item.action.type));
      assert.ok(item.shortcut.trim());
      assert.equal(Object.hasOwn(item.action, 'label'), false);
    }
  }
});

test('selection returns a fresh plain action while preserving the feature name separately', async () => {
  const { loadShortcutCatalog } = registry;
  const input = record('copy', { action: { type: 'key', keys: ['meta', 'shift', 'c'], label: '이전 동작 이름' } });
  const catalog = await loadShortcutCatalog('system', { fetcher: fixtureFetcher([input]) });
  const item = items(catalog)[0];
  assert.equal(item.label, '복사');
  assert.deepEqual(item.action, { type: 'key', keys: ['SHIFT', 'META', 'C'] });
  assert.equal(item.shortcut, 'Shift + Cmd + C');
  item.action.keys.push('A');
  assert.deepEqual(input.action.keys, ['meta', 'shift', 'c']);
});

test('repeated slot aliases deduplicate within a group but retain different contexts', async () => {
  const { loadShortcutCatalog } = registry;
  const records = [record('copy-first'), record('copy-repeat'), record('copy-context', { notes: '검색 결과 필드' }), record('copy-next-layer', { layer: 2 })];
  const catalog = await loadShortcutCatalog('system', { fetcher: fixtureFetcher(records) });
  assert.deepEqual(catalog.groups[0].items.map(item => item.id), ['copy-first', 'copy-context']);
  assert.deepEqual(catalog.groups[1].items.map(item => item.id), ['copy-next-layer']);
});

test('unsupported and unverified records never become selectable commands', async () => {
  const { loadShortcutCatalog } = registry;
  const records = [
    record('valid'),
    record('preserve', { action: { type: 'preserve' } }),
    record('disabled', { action: { type: 'disabled' } }),
    record('unverified', { status: 'unverified-default' }),
    record('timed', { status: 'unsupported-timing' }),
    record('unconfigured', { status: 'requires-app-configuration' }),
    record('unknown-status', { status: 'unrecognized-proof' }),
    record('bad-chord', { action: { type: 'key', keys: ['A', 'B'] } }),
    record('shell', { action: { type: 'shell', command: 'anything' } }),
    record('bad-layer', { layer: 4 }),
  ];
  const catalog = await loadShortcutCatalog('system', { fetcher: fixtureFetcher(records) });
  assert.deepEqual(items(catalog).map(item => item.id), ['valid']);
});

test('game proposals and configured app options retain explicit warnings and setup instructions', async () => {
  const { loadShortcutCatalog } = registry;
  const game = await loadShortcutCatalog('modern-warfare4-pc', { fetcher: localFetcher });
  const proposals = items(game).filter(item => item.status === 'proposed-remap');
  assert.equal(proposals.length, 16);
  assert.ok(proposals.every(item => /제안|기본값/.test(item.warning) && item.sourceUrl === null));
  assert.ok(game.setupInstructions.length > 0);
  const claude = await loadShortcutCatalog('claude-mac', { fetcher: localFetcher });
  const option = items(claude).find(item => item.id === 'layer-1-quick-entry');
  assert.deepEqual(option.action, { type: 'key', keys: ['ALT', 'SPACE'] });
  assert.match(option.warning, /설정/);
  assert.ok(claude.setupInstructions.some(text => text.includes('Option + Space')));
});

test('source links are display-only HTTPS URLs and unsafe schemes are removed', async () => {
  const { loadShortcutCatalog } = registry;
  const records = ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', '//example.com', 'https://example.com/docs'].map((sourceUrl, number) => record(`source-${number}`, { label: `자료 ${number}`, sourceUrl }));
  const requested = [];
  const fetcher = fixtureFetcher(records);
  const catalog = await loadShortcutCatalog('system', { fetcher: async url => { requested.push(url); return fetcher(url); } });
  assert.deepEqual(items(catalog).map(item => item.sourceUrl), [null, null, null, null, 'https://example.com/docs']);
  assert.equal(requested.length, 2);
  assert.ok(requested.every(url => new URL(url).href.startsWith(datasetRoot.href)));
});

test('unknown applications cannot inject a fetch path', async () => {
  const { loadShortcutCatalog } = registry;
  let calls = 0;
  for (const id of ['https://example.com/data.json', '../system-mac', '__proto__', {}, 42]) {
    await assert.rejects(loadShortcutCatalog(id, { fetcher: async () => { calls += 1; throw Error('must not fetch'); } }), /앱|application/i);
  }
  assert.equal(calls, 0);
});

test('a modified manifest cannot redirect a whitelisted dataset request', async () => {
  const { loadShortcutCatalog } = registry;
  const fetcher = fixtureFetcher([record('copy')], manifest => {
    manifest.datasets.find(entry => entry.id === 'system-mac').datasetPath = 'https://example.com/evil.json';
    return manifest;
  });
  let calls = 0;
  await assert.rejects(loadShortcutCatalog('system', { fetcher: async url => { calls += 1; return fetcher(url); } }), /경로|목록|dataset|catalog/i);
  assert.equal(calls, 1);
});

test('network failures and malformed catalog files reject with a recoverable error', async () => {
  const { loadShortcutCatalog } = registry;
  await assert.rejects(loadShortcutCatalog('system', { fetcher: async () => new Response('missing', { status: 404 }) }), /불러|읽|load|404/i);
  await assert.rejects(loadShortcutCatalog('system', { fetcher: async () => new Response('{', { status: 200 }) }), /불러|읽|형식|catalog/i);
  await assert.rejects(loadShortcutCatalog('system', { fetcher: fixtureFetcher(null) }), /형식|records|catalog/i);
});

test('lookup matches an assigned action independently of an optional saved label', async () => {
  const { loadShortcutCatalog, findShortcutLabel } = registry;
  const catalog = await loadShortcutCatalog('vscode-mac', { fetcher: localFetcher });
  assert.equal(findShortcutLabel(catalog, { type: 'key', keys: ['META', 'S'], label: '사용자가 저장한 이름' }), '저장');
  assert.equal(findShortcutLabel(catalog, { type: 'key', keys: ['F24'] }), '');
  assert.equal(findShortcutLabel(catalog, { type: 'preserve' }), '');
});

test('recommended system features survive selection, profile export and HID encoding', async () => {
  const { createProfile, validateProfile } = await import('../src/profile.js');
  const { encodeAction, decodeAction } = await import('../src/protocol.js');
  const catalog = await registry.loadShortcutCatalog('system', { fetcher: localFetcher });
  const expected = {
    'capture-clipboard': ['CTRL', 'SHIFT', 'META', '4'],
    'lock-screen': ['CTRL', 'META', 'Q'],
    'mission-control': ['CTRL', 'UP'],
    'previous-desktop': ['CTRL', 'LEFT'],
    'next-desktop': ['CTRL', 'RIGHT'],
    spotlight: ['META', 'SPACE'],
    'next-app-window': ['META', 'GRAVE'],
    'hide-other-apps': ['ALT', 'META', 'H'],
    'screenshot-recording': ['SHIFT', 'META', '5'],
    'emoji-symbols': ['CTRL', 'META', 'SPACE'],
    fullscreen: ['CTRL', 'META', 'F'],
  };
  for (const [id, keys] of Object.entries(expected)) {
    const item = items(catalog).find(item => item.id === `system-${id}`);
    assert.ok(item, id);
    assert.deepEqual(item.action, { type: 'key', keys });
    assert.equal(item.warning, undefined);
  }
  for (const item of items(catalog).filter(item => item.id.startsWith('system-'))) {
    const profile = createProfile('System actions');
    profile.layers[0].actions[0] = { ...item.action, label: item.label };
    const restored = validateProfile(JSON.parse(JSON.stringify(profile)));
    assert.equal(restored.layers[0].actions[0].label, item.label);
    const raw = new Uint8Array(64); raw.set([3, 250, 1, 1]);
    assert.deepEqual(decodeAction(encodeAction(raw, restored.layers[0].actions[0])), item.action);
    assert.equal(profile.layers[0].actions[1].type, 'preserve');
  }
});

test('system catalog contains defaults without fabricated app-launch or microphone bindings',async()=>{
 const catalog=await registry.loadShortcutCatalog('system',{fetcher:localFetcher});
 assert.ok(items(catalog).every(item=>item.status!=='configured-option'&&!item.warning));
 for(const id of ['system-open-browser','system-open-terminal','system-open-notes','system-tile-left','system-tile-right','system-microphone-mute'])assert.ok(!items(catalog).some(item=>item.id===id));
 assert.ok(items(catalog).some(item=>item.label==='전체 화면 캡처'));
 assert.ok(items(catalog).some(item=>item.action.type==='media'&&item.action.key==='MUTE'));
});

test('new system function labels and setup help are translated in all supported locales', async () => {
  const { translate, SUPPORTED_LOCALES } = await import('../src/i18n.js');
  const catalog = await registry.loadShortcutCatalog('system', { fetcher: localFetcher });
  const newItems = items(catalog).filter(item => item.id.startsWith('system-'));
  assert.ok(newItems.length >= 17);
  for (const locale of SUPPORTED_LOCALES.filter(locale => locale !== 'ko')) {
    for (const text of [...newItems.flatMap(item => [item.label, item.notes]), ...catalog.setupInstructions]) {
      assert.notEqual(translate(text, locale), text, `${locale}: ${text}`);
      assert.doesNotMatch(translate(text, locale), /[가-힣]/);
    }
  }
});

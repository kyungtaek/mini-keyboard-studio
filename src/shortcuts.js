import { actionLabel, createProfile, validateProfile } from './profile.js';

// Files are intentionally fixed here. A manifest entry never becomes a fetch URL.
export const APPLICATIONS = Object.freeze([
  { id: 'system', name: '시스템 기본', platform: 'macOS', datasetFile: 'system-mac.json', bundleIds: [] },
  { id: 'vscode-mac', name: 'Visual Studio Code', platform: 'macOS', datasetFile: 'vscode-mac.json', bundleIds: ['com.microsoft.VSCode'] },
  { id: 'codex-mac', name: 'Codex 앱', platform: 'macOS', datasetFile: 'codex-mac.json', bundleIds: [] },
  { id: 'claude-mac', name: 'Claude 앱', platform: 'macOS', datasetFile: 'claude-mac.json', bundleIds: [] },
  { id: 'modern-warfare4-pc', name: 'Call of Duty: Modern Warfare 4 (2026)', platform: 'Windows PC', datasetFile: 'modern-warfare4-pc.json', bundleIds: [] },
  { id: 'forza-horizon4-pc', name: 'Forza Horizon 4', platform: 'Windows PC', datasetFile: 'forza-horizon4-pc.json', bundleIds: [] },
].map(application => Object.freeze({ ...application, bundleIds: Object.freeze(application.bundleIds) })));

const SELECTABLE_STATUSES = new Set(['published-default', 'standard-hid', 'os-convention', 'proposed-remap', 'configured-option']);
const ACTION_TYPES = new Set(['key', 'macro', 'media', 'mouse']);
const WARNINGS = {
  'proposed-remap': '사용자 지정 바인딩 제안입니다. 공식 기본값이 아니며 게임 설정에서 이 키에 맞춰야 합니다.',
  'configured-option': '앱에서 같은 단축키 옵션을 먼저 설정해야 합니다. 아래 설정 안내를 확인하세요.',
};

function text(value, maximum = 2000) {
  return typeof value === 'string' && value.length <= maximum ? value.trim() : '';
}

function sourceLink(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function normalizedAction(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !ACTION_TYPES.has(value.type)) return null;
  try {
    const action = structuredClone(value);
    // A catalog's feature name stays separate from a saved profile action label.
    delete action.label;
    const carrier = createProfile('단축키 검증');
    carrier.layers[0].actions[0] = action;
    return validateProfile(carrier).layers[0].actions[0];
  } catch { return null; }
}

function formattedShortcut(action, platform) {
  let label = actionLabel(action);
  if (platform === 'macOS') label = label.replace(/\bMeta\b/g, 'Cmd').replace(/\bAlt\b/g, 'Option');
  return label;
}

async function readLocalJson(file, fetcher) {
  const url = new URL(`../data/shortcuts/${file}`, import.meta.url).href;
  try {
    const response = await fetcher(url);
    if (!response?.ok) throw new Error(`HTTP ${response?.status ?? '오류'}`);
    return await response.json();
  } catch (error) {
    throw new Error(`단축키 목록을 불러올 수 없습니다 (${file}). 다시 시도해 주세요.`, { cause: error });
  }
}

/** Load selectable features. No device, application setting or profile is changed. */
export async function loadShortcutCatalog(appId = 'system', { fetcher = globalThis.fetch } = {}) {
  const selectedId = appId === undefined || appId === null || appId === '' ? 'system' : appId;
  const application = APPLICATIONS.find(application => application.id === selectedId);
  if (!application) throw new Error('지원하지 않는 앱입니다. 시스템 기본 또는 목록의 앱을 선택해 주세요.');
  if (typeof fetcher !== 'function') throw new Error('단축키 목록을 불러올 수 없습니다.');

  const manifest = await readLocalJson('index.json', fetcher);
  const datasetId = application.datasetFile.slice(0, -5);
  const entries = Array.isArray(manifest?.datasets) ? manifest.datasets.filter(entry => entry?.id === datasetId) : [];
  const entry = entries[0];
  if (entries.length !== 1 || entry.datasetPath !== `data/shortcuts/${application.datasetFile}`
    || !Array.isArray(entry.layerNames) || entry.layerNames.length !== 3 || entry.layerNames.some(name => !text(name, 80))) {
    throw new Error('단축키 목록의 경로 또는 레이어 형식이 올바르지 않습니다.');
  }

  const data = await readLocalJson(application.datasetFile, fetcher);
  if (data?.id !== datasetId || !Array.isArray(data.records) || data.records.length > 1500) {
    throw new Error('단축키 데이터 형식이 올바르지 않습니다.');
  }
  const groups = entry.layerNames.map((name, index) => ({ id: `layer-${index + 1}`, name: name.trim(), items: [] }));
  const seen = groups.map(() => new Set());
  const seenIds = new Set();
  for (const record of data.records) {
    if (!record || !Number.isInteger(record.layer) || record.layer < 1 || record.layer > groups.length
      || !SELECTABLE_STATUSES.has(record.status)) continue;
    const id = text(record.id, 150);
    const label = text(record.label, 200);
    const action = normalizedAction(record.action);
    if (!id || !label || !action || seenIds.has(id)) continue;
    const notes = text(record.notes);
    // Identical slot aliases collapse, while layers and explanatory contexts remain distinct.
    const dedupeKey = JSON.stringify([label, action, record.status, notes]);
    const groupIndex = record.layer - 1;
    if (seen[groupIndex].has(dedupeKey)) continue;
    seen[groupIndex].add(dedupeKey);
    seenIds.add(id);
    const item = { id, label, action, shortcut: formattedShortcut(action, application.platform), sourceUrl: sourceLink(record.sourceUrl), status: record.status, notes };
    if (WARNINGS[record.status]) item.warning = WARNINGS[record.status];
    groups[groupIndex].items.push(item);
  }

  return {
    application,
    groups: groups.filter(group => group.items.length),
    setupInstructions: Array.isArray(data.setupInstructions) ? data.setupInstructions.map(instruction => text(instruction)).filter(Boolean) : [],
  };
}

/** Find a feature name for an existing action, ignoring optional saved labels. */
export function findShortcutLabel(catalog, action) {
  const normalized = normalizedAction(action);
  if (!normalized || !Array.isArray(catalog?.groups)) return '';
  const signature = JSON.stringify(normalized);
  for (const group of catalog.groups) {
    if (!Array.isArray(group.items)) continue;
    const item = group.items.find(item => JSON.stringify(item.action) === signature);
    if (item) return item.label;
  }
  return '';
}

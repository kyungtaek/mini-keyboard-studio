import { createProfile, validateProfile, actionLabel, encodeShare, decodeShare, saveToLibrary, loadLibrary, deleteFromLibrary } from './profile.js';
import { connectDevice } from './device.js';
import { applyKeymap,lightingActivationNote } from './apply-keymap.js';
import { keyLightingHTML,updateKeyLighting } from './key-lighting-ui.js';
import { toProfileActions } from './action-mapping.js';
import { companionCall } from './companion.js';
import { validateBackup, decodeAction, fromHex } from './protocol.js';
import { MODELS, getModel, gridActionIds, actionCount } from './models.js';
import { seedDesktopLibrary } from './desktop.js';
import { isAppAction } from './navigation.js';
import { initInputDebug } from './input-debug-ui.js';
import { initLightingEditor } from './lighting-editor.js';
import { rotateProfileKeys } from './rotation.js';
import { APPLICATIONS,loadShortcutCatalog,findShortcutLabel } from './shortcuts.js';

const DRAFT_KEY = 'mini-keyboard-studio:draft:v1';
const BACKUP_KEY = 'mini-keyboard-studio:backups:v1';
const MAX_FILE = 128 * 1024;
const LED_RULES_KEY = 'mini-keyboard-studio:led-rules:v1';
const ledStates = [{state:'working',name:'작업 중',symbol:'◌',color:'#539df5'},{state:'attention',name:'확인 필요',symbol:'!',color:'#ffa42b'},{state:'done',name:'완료',symbol:'✓',color:'#1ed760'},{state:'error',name:'오류',symbol:'×',color:'#f3727f'}];
let ledWriteAllowed = false;
const modelList = Array.isArray(MODELS) ? MODELS : Object.values(MODELS);
const currentModel = () => getModel(profile.modelId);
let sharedAtStartup = false;
const media = { VOLUME_UP: '음량 높이기', VOLUME_DOWN: '음량 낮추기', MUTE: '음소거', PLAY_PAUSE: '재생 / 일시 정지', NEXT_TRACK: '다음 곡', PREVIOUS_TRACK: '이전 곡', STOP: '재생 정지' };
const mouse = { LEFT_CLICK: '왼쪽 클릭', RIGHT_CLICK: '오른쪽 클릭', MIDDLE_CLICK: '가운데 클릭', SCROLL_UP: '위로 스크롤', SCROLL_DOWN: '아래로 스크롤' };
const icons = { light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>', plus: '<path d="M12 5v14M5 12h14"/>', save: '<path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8"/>', import: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', export: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4M9 14l6 4"/>', usb: '<path d="M12 21V5m-3 3 3-5 3 5M12 15l6-5V6M12 18l-6-4v-4"/><circle cx="6" cy="9" r="2"/><path d="M16 3h4v4h-4"/>', file: '<path d="M14 2H5v20h14V7Zm0 0v6h5M8 13h8M8 17h6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 12h2m2 0h2m2 0h2m2 0h2M7 15h10"/>' };
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const $ = (selector, root = document) => root.querySelector(selector);
let profile = createProfile();
let layer = 0;
let selected = 1;
let device = null;
let deviceSnapshot = null;
let busy = false;
let recording = false;
let rotationChange = null;
let shortcutApplicationId='system';
let editorMode='functions',functionCatalog=null,functionLoading='',functionError='',functionQuery='',functionGroup='',functionScroll=0;
const functionCatalogCache=new Map();
let toastTimer;
let draftTimer;
let library = [];
let copiedLayer = null;
let notice = '';
let draftFailed = false;

try {
  const stored = localStorage.getItem(DRAFT_KEY);
  if (stored) profile = validateProfile(JSON.parse(stored));
} catch (error) { notice = '이전 작업을 불러오지 못했습니다. 새 키맵에서 시작합니다. 저장 파일이 있다면 가져오기를 사용하세요.'; }
if (location.hash.startsWith('#keymap=')) {
  try {
    profile = decodeShare(location.hash);
    // A shared profile becomes a separate draft, even when its id matches a saved profile.
    profile.id = createProfile().id;
    notice = '';
    sharedAtStartup = true;
  } catch (error) { notice = `공유 링크를 열 수 없습니다: ${error.message}`; }
}

$('#app').innerHTML = `
  <div class="workspace">
    <aside class="sidebar" aria-label="키맵 보관함">
      <div class="sidebar-heading"><h2>내 키맵</h2><button class="quiet new-keymap" data-action="new" title="새 키맵" aria-label="새 키맵">${icon('plus')}</button></div>
      <div class="library-list" id="library-list"></div>
      <nav class="sidebar-tools" aria-label="키맵 도구"><button class="quiet" data-action="presets">${icon('keyboard')}키맵 카탈로그</button><button class="quiet" data-action="files">${icon('file')}파일·공유</button></nav>

    </aside>
    <main class="editor-main">
      <div class="profile-heading"><div class="profile-title"><label class="sr-only" for="profile-name">키맵 이름</label><input class="profile-name" id="profile-name" maxlength="80" aria-label="키맵 이름"><span class="sr-only" id="profile-meta"></span></div><span class="save-state" id="save-state">작업 자동 보관</span><button data-action="save" class="primary compact-save" title="내 키맵에 저장">${icon('save')}저장</button></div>
      <div class="hardware-controls"><label class="model-field"><span>키보드 모델</span><select id="model-select">${modelList.map(model=>`<option value="${escapeHTML(model.id)}">${escapeHTML(model.name)}${model.verified?'':' · 실기 미검증'}</option>`).join('')}</select></label><div class="orientation-field"><span>놓는 방향</span><div class="orientation-options" role="group" aria-label="키보드 방향"><button data-rotate="left" aria-label="왼쪽으로 회전">↶ 왼쪽</button><button data-rotate="right" aria-label="오른쪽으로 회전">오른쪽 ↷</button><button data-rotate="reset" aria-label="방향 초기화">초기화</button><span id="rotation-angle" aria-label="현재 방향">0°</span></div></div></div>
      <div class="board-heading"><div class="layers" role="tablist" aria-label="편집할 레이어"></div><span class="model-note" id="model-note"></span></div>
      <div id="keyboard-layout" role="tabpanel" aria-labelledby="layer-tab-0"><div class="hardware-stage"><div class="board-shell"><div class="keyboard"><div class="hardware-face"><div class="key-grid" id="key-grid" aria-label="키패드"></div><div class="encoders" id="encoders" aria-label="다이얼 설정"></div></div><div class="keyboard-footer"><span id="board-model-label"></span><span class="keyboard-led" aria-hidden="true"></span><span id="board-layer-label">LAYER 01</span></div></div></div></div></div>
      <div class="quick-actions"><button class="quiet small" data-action="copy-layer" title="현재 레이어 복사">${icon('file')}레이어 복사</button><button class="quiet small" data-action="paste-layer" id="paste-layer" disabled>붙여넣기</button></div>
      <footer class="apply-bar"><button class="quiet apply-device" data-action="devices">${icon('usb')}<span id="apply-device-label">장치 연결 전</span></button><div class="apply-guard" title="현재 키·다이얼 동작을 먼저 백업합니다.">${icon('lock')}자동 백업</div><button class="quiet footer-connection" data-action="devices"><span class="status-dot" id="header-device-dot"></span><span id="header-device-label">장치 연결</span>${icon('usb')}</button><span id="apply-hint" class="sr-only">키·다이얼 동작 백업 후 적용</span><button class="primary" data-action="apply" id="apply-button" disabled>${icon('usb')}장치에 적용</button></footer><p class="device-message" id="device-message" role="status"></p>
      <div class="session-notice" id="session-notice" hidden></div>
    </main>
    <aside class="action-panel" aria-labelledby="action-heading"><div class="action-panel-inner"><div class="action-header"><div><h2 id="action-heading">동작 편집</h2><p id="selection-caption"></p></div><span class="selection-badge" id="selection-badge"></span></div><div id="action-editor"></div><button class="quiet small help-button" title="원래 동작 유지: 장치에 저장된 동작을 그대로 둡니다. 레이어 선택은 편집할 설정을 바꾸며, 실제 레이어는 키보드에서 전환합니다." aria-label="동작 편집 도움말">ⓘ</button></div></aside>
  </div>
  <input class="file-input" type="file" id="import-file" accept=".json,application/json">
  <input class="file-input" type="file" id="backup-file" accept=".json,application/json">
  <dialog id="new-profile-dialog" class="tool-dialog" aria-labelledby="new-profile-title"><div class="dialog-heading"><h2 id="new-profile-title">새 키맵</h2><button class="quiet small" data-close="new-profile-dialog" aria-label="닫기">${icon('close')}</button></div><form id="new-profile-form"><label class="field"><span class="field-label">키맵 이름</span><input id="new-profile-name" maxlength="80" required value="새 키맵"></label><label class="field"><span class="field-label">키보드 모델</span><select id="new-profile-model">${modelList.map(model=>`<option value="${model.id}">${escapeHTML(model.name)}</option>`).join('')}</select></label><div class="dialog-actions"><button type="button" data-close="new-profile-dialog">취소</button><button type="submit" class="primary">만들기</button></div></form></dialog>
  <dialog id="rotation-dialog" class="tool-dialog rotation-dialog" aria-labelledby="rotation-title"><div class="dialog-heading"><h2 id="rotation-title">변경된 방향으로 키를 다시 설정할까요?</h2><button class="quiet small" data-close="rotation-dialog" aria-label="닫기">${icon('close')}</button></div><div class="rotation-preview"><span class="rotation-symbol" aria-hidden="true">↻</span><strong id="rotation-target"></strong></div><p class="rotation-summary">세 레이어의 키를 기존 화면 위치에 맞춰 옮깁니다.<br>노브 설정은 유지합니다.</p><p class="error-text" id="rotation-reason" role="status"></p><div class="dialog-actions"><button data-close="rotation-dialog">화면 방향만 변경</button><button class="primary" data-action="apply-rotation" id="rotation-apply">키 재배치·적용</button></div></dialog>
  <dialog id="files-dialog" class="tool-dialog" aria-labelledby="files-title"><div class="dialog-heading"><h2 id="files-title">파일·공유</h2><button class="quiet small" data-close="files-dialog" aria-label="닫기">${icon('close')}</button></div><div class="file-context">${icon('file')}<span id="file-profile-name"></span><span class="file-format">JSON</span></div><div class="tool-actions"><button data-action="import">${icon('import')}<span><strong>키맵 파일 열기</strong><small>JSON 파일에서 가져오기</small></span><span class="tool-arrow" aria-hidden="true">↗</span></button><button data-action="export">${icon('export')}<span><strong>파일로 내보내기</strong><small>현재 키맵 저장</small></span><span class="tool-arrow" aria-hidden="true">↗</span></button><button data-action="share">${icon('share')}<span><strong>링크로 공유</strong><small>키맵이 담긴 링크 만들기</small></span><span class="tool-arrow" aria-hidden="true">↗</span></button></div><div class="files-diagnostics"><button class="quiet small" data-action="input-debug">${icon('keyboard')}키 입력 진단</button><button class="quiet small" data-action="open-logs">${icon('clock')}진단 로그 폴더 열기</button></div></dialog>
  <dialog id="devices-dialog" class="tool-dialog device-dialog" aria-labelledby="devices-title"><div class="dialog-heading"><h2 id="devices-title">장치 관리</h2><button class="quiet small" data-close="devices-dialog" aria-label="닫기">${icon('close')}</button></div><div class="device-portrait"><div class="mini-device" aria-hidden="true">${Array.from({length:16},()=>'<i></i>').join('')}<span>◉ ◉ ◉</span></div><div><h3 id="device-model-name">키보드</h3><span class="status" id="connection-status"><span class="status-dot"></span>장치 연결 전</span></div></div><div class="device-connection-row"><label class="transport-field"><span class="sr-only">연결 방식</span><select id="transport-select" aria-label="연결 방식"><option value="webhid">브라우저 USB</option><option value="companion">보조앱</option></select></label><button data-action="connect">${icon('usb')}<span>키보드 연결</span></button></div><p id="device-description" class="device-detail" role="status"></p><div class="device-utilities"><button class="quiet" data-action="read-device" id="read-device" disabled>${icon('import')}설정 읽기</button><button class="quiet" data-action="backups">${icon('clock')}장치 백업</button><button class="quiet" id="led-open-button" data-action="lighting" disabled title="보조앱 연결에서 사용" aria-label="상태·LED">${icon('light')}상태·LED</button></div></dialog>
  <dialog id="share-dialog" aria-labelledby="share-title"><div class="dialog-heading"><h2 id="share-title">키맵 링크 공유</h2><button class="quiet small" data-close="share-dialog" aria-label="닫기">${icon('close')}</button></div><p>키맵을 링크에 담았습니다. 링크를 받은 사람은 자신의 작업으로 열어 수정할 수 있습니다. 장치 백업은 포함하지 않습니다.</p><label class="sr-only" for="share-url">공유 링크</label><input class="share-input" id="share-url" readonly><p class="share-privacy">링크에는 키 입력과 매크로가 그대로 들어갑니다. 비밀번호 등 민감한 내용을 넣지 마세요.</p><div class="dialog-actions"><button data-action="copy-share" class="primary">링크 복사</button></div></dialog>
  <dialog id="presets-dialog" class="catalog-dialog" aria-labelledby="presets-title"><div class="dialog-heading"><div><h2 id="presets-title">키맵 카탈로그</h2><p class="catalog-subtitle">마음에 드는 키맵을 골라 내 키보드에 맞춰 보세요.</p></div><button class="quiet small" data-close="presets-dialog" aria-label="닫기">${icon('close')}</button></div>
    <div class="catalog-topline"><div class="catalog-tabs" role="tablist" aria-label="키맵 출처"><button role="tab" id="catalog-github-tab" aria-selected="true" aria-controls="catalog-remote" data-catalog-tab="github">GitHub 카탈로그</button><button role="tab" id="catalog-bundled-tab" aria-selected="false" aria-controls="catalog-bundled" data-catalog-tab="bundled">기본 샘플</button></div><button class="quiet small" data-action="catalog-settings" id="catalog-settings">연결 설정</button></div>
    <section id="catalog-remote" role="tabpanel" aria-labelledby="catalog-github-tab"><div class="catalog-source"><span id="catalog-auth">GitHub 연결 확인 전</span><button class="quiet small" data-action="catalog-refresh" id="catalog-refresh">새로고침</button></div><div class="catalog-filters"><label><span class="sr-only">키맵 검색</span><input type="search" id="catalog-search" placeholder="이름, 앱, 태그 검색" autocomplete="off"></label><label><span class="sr-only">플랫폼 필터</span><select id="catalog-platform"><option value="">모든 플랫폼</option><option value="mac">Mac</option><option value="windows">Windows</option><option value="linux">Linux</option><option value="any">공통</option></select></label><label><span class="sr-only">키보드 모델 필터</span><select id="catalog-model"><option value="">모든 모델</option>${modelList.map(model=>`<option value="${escapeHTML(model.id)}">${escapeHTML(model.name)}</option>`).join('')}</select></label></div><p id="catalog-status" class="catalog-status" role="status"></p><div id="catalog-list" class="catalog-grid"></div></section>
    <section id="catalog-bundled" role="tabpanel" aria-labelledby="catalog-bundled-tab" hidden><p class="catalog-status">앱에 포함된 샘플입니다. 편집기로 열어 수정할 수 있습니다.</p><div class="catalog-grid" id="presets-list"></div></section>
    <p id="catalog-result" class="catalog-result" role="status"></p>
  </dialog>
  <dialog id="catalog-token-dialog" class="catalog-token-dialog" aria-labelledby="catalog-token-title"><div class="dialog-heading"><h2 id="catalog-token-title">GitHub 연결</h2><button class="quiet small" data-close="catalog-token-dialog" aria-label="닫기">${icon('close')}</button></div><p class="small-text muted">kyungtaek/mini-keyboard-keymap-catalog</p><p class="catalog-status" id="catalog-token-status"></p><p class="small-text muted">GitHub CLI에 로그인되어 있으면 그대로 사용할 수 있습니다. 토큰으로 연결하려면 이 저장소만 선택한 Fine-grained token에 Contents: Read-only 권한을 주세요. 비공개 저장소용 classic token은 repo 범위가 필요합니다.</p><form id="catalog-token-form"><label class="field"><span class="field-label">GitHub 토큰</span><input type="password" id="catalog-token" autocomplete="off" spellcheck="false" placeholder="토큰 붙여넣기" required></label><p class="catalog-status">토큰은 데스크톱 앱의 암호화 저장소에 보관합니다.</p><p class="error-text" id="catalog-token-error" role="alert"></p><div class="dialog-actions"><button type="button" class="quiet" data-action="catalog-clear-token" id="catalog-clear-token">저장한 토큰 삭제</button><button type="submit" class="primary" id="catalog-save-token">연결</button></div></form></dialog>
  <dialog id="backups-dialog" aria-labelledby="backups-title"><div class="dialog-heading"><h2 id="backups-title">장치 백업</h2><button class="quiet small" data-close="backups-dialog" aria-label="닫기">${icon('close')}</button></div><p>적용 전 읽어 둔 장치의 키·다이얼 동작입니다. LED·펌웨어는 포함하지 않습니다. 복원할 때도 현재 키·다이얼 동작을 먼저 백업합니다.</p><div id="backup-list" class="backup-list"></div><div class="dialog-actions"><button data-action="import-backup">${icon('import')}백업 파일 가져오기</button><button data-close="backups-dialog">닫기</button></div></dialog>
  <dialog id="lighting-dialog" class="lighting-dialog" aria-labelledby="lighting-title"><div class="dialog-heading"><div class="lighting-title"><h2 id="lighting-title">상태·LED</h2><span class="manual-badge" title="앱의 실제 상태와 연동하지 않는 수동 이벤트 테스트입니다.">수동 이벤트</span></div><button class="quiet small" data-close="lighting-dialog" aria-label="닫기">${icon('close')}</button></div><section id="direct-lighting-editor"></section><details class="led-state-details"><summary>앱 상태 연동 테스트</summary><div class="lighting-switch-row"><span id="lighting-capability" class="muted small-text">연결 확인 중</span><label class="lighting-switch" title="켜고 상태를 누르면 해당 레이어의 장치 LED를 변경합니다. 변경 전 원본 LED를 백업하고 재읽기로 검증합니다."><input type="checkbox" id="lighting-enabled"><span class="switch-track" aria-hidden="true"></span><span>장치 LED 사용</span></label></div><div class="lighting-rules" id="lighting-rules">${ledStates.map(item=>`<div class="lighting-rule" data-led-rule="${item.state}"><button class="state-event" data-led-state="${item.state}"><span class="state-symbol" aria-hidden="true">${item.symbol}</span>${item.name}</button><label class="color-picker" title="${item.name} 색"><input type="color" value="${item.color}" data-led-color="${item.state}" aria-label="${item.name} 색"></label><select data-led-layer="${item.state}" aria-label="${item.name} 레이어"><option value="0">레이어 1</option><option value="1">레이어 2</option><option value="2">레이어 3</option></select></div>`).join('')}</div></details><div class="lighting-preview" id="lighting-preview" hidden><span class="lighting-swatch" id="lighting-swatch" aria-hidden="true"></span><div><strong id="lighting-result-label">미리보기</strong><span id="lighting-result-detail"></span></div></div><div class="error-text" id="lighting-error" role="alert"></div><div class="lighting-readings" id="lighting-readings"></div><div class="lighting-actions"><button data-action="read-lighting">${icon('light')}장치 LED 읽기</button><button class="quiet" data-action="restore-lighting" title="보조앱이 변경 전에 백업한 원래 LED로 복원하고 다시 읽어 확인합니다.">원래 LED 복원</button></div></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

function toast(message, error = false) {
  clearTimeout(toastTimer);
  const node = $('#toast');
  node.textContent = message;
  if(error)diagnostic('error','ui.operation.failed');
  node.className = `toast visible${error ? ' error' : ''}`;
  toastTimer = setTimeout(() => node.classList.remove('visible'), error ? 8000 : 4200);
}
function explain(error) { return error?.message || String(error); }
function dateLabel(date) { const value = new Date(date); return Number.isNaN(value.getTime()) ? '날짜 없음' : value.toLocaleString('ko-KR', { month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
function getAction(id = selected) { return profile.layers[layer].actions[id - 1]; }
function getLabel(action) { try { return action?.label || actionLabel(action); } catch { return '알 수 없는 동작'; } }
function shortLabel(action) {
  if (!action || action.type === 'preserve') return '사용자 동작';
  if (action.type === 'disabled') return '—';
  const symbols = {CTRL:'⌃',SHIFT:'⇧',ALT:'⌥',META:'⌘',RCTRL:'⌃',RSHIFT:'⇧',RALT:'⌥',RMETA:'⌘',LEFT:'←',RIGHT:'→',UP:'↑',DOWN:'↓',ENTER:'↵',TAB:'⇥',SPACE:'␣',BACKSPACE:'⌫',DELETE:'⌦',ESC:'esc',PAGE_UP:'PgUp',PAGE_DOWN:'PgDn',LEFT_BRACKET:'[',RIGHT_BRACKET:']',GRAVE:'`',COMMA:',',PERIOD:'.',SLASH:'/'};
  if (action.type === 'key') return action.keys.map(key=>symbols[key]||key).join(' ');
  if (action.type === 'macro') return '매크로';
  if (action.type === 'media') return ({VOLUME_UP:'Vol +',VOLUME_DOWN:'Vol −',MUTE:'음소거',PLAY_PAUSE:'⏯',NEXT_TRACK:'⏭',PREVIOUS_TRACK:'⏮',STOP:'⏹'})[action.key]||getLabel(action);
  return ({LEFT_CLICK:'좌클릭',RIGHT_CLICK:'우클릭',MIDDLE_CLICK:'중클릭',SCROLL_UP:'휠 ↑',SCROLL_DOWN:'휠 ↓'})[action.key]||getLabel(action);
}
function snapshotAction(id=selected) {
  return deviceSnapshot?.modelId === profile.modelId ? deviceSnapshot.actions[layer]?.[id-1] || null : null;
}
function currentLabel(action) { return action?.type === 'preserve' ? '사용자 동작' : action ? getLabel(action) : '연결 후 표시'; }
function boardValue(id) {
  const draft = getAction(id), current = snapshotAction(id);
  const changed = draft.type !== 'preserve' && (!current || actionLabel(draft) !== actionLabel(current));
  return {draft,current,changed,label:draft.type==='preserve' ? (current ? shortLabel(current) : '·') : shortLabel(draft),title:current ? `현재: ${currentLabel(current)}${changed?` / 편집: ${getLabel(draft)}`:''}` : getLabel(draft)};
}
function installSnapshot(backup) {
  const modelId=backup.modelId || device?.modelId || 'mini-16x3';
  deviceSnapshot = {modelId,mappingRevision:'direct-wire-v1',actions:backup.layers.map(records=>toProfileActions(modelId,records.map(raw=>{try{return decodeAction(fromHex(raw));}catch{return {type:'preserve'};}})))};
}
async function refreshSnapshot() { installSnapshot(await device.readAll()); renderBoard(); renderEditor(); }

function scheduleDraft() {
  clearTimeout(draftTimer);
  $('#save-state').textContent = '작업 보관 중…';
  draftTimer = setTimeout(persistDraft, 200);
}
function persistDraft() {
  clearTimeout(draftTimer);
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(profile));
    $('#save-state').textContent = '작업 자동 보관됨';
    draftFailed = false;
  } catch (error) {
    $('#save-state').textContent = '자동 보관 실패';
    if (!draftFailed) toast('브라우저 저장 공간에 작업을 보관하지 못했습니다. JSON으로 내보내 주세요.', true);
    draftFailed = true;
  }
}
function touch() { profile.updatedAt = new Date().toISOString(); scheduleDraft(); }
function renderLibrary() {
  try { library = loadLibrary(); }
  catch (error) { library = []; toast(`보관함을 읽지 못했습니다: ${explain(error)}`, true); }
  $('#library-list').innerHTML = library.length ? library.map(item => `<div class="library-item"><button class="library-open ${item.id === profile.id ? 'active' : ''}" data-open="${escapeHTML(item.id)}" title="${escapeHTML(item.name)}">${icon('file')}<span class="library-text"><span>${escapeHTML(item.name)}</span><small>${escapeHTML(getModel(item.modelId).name)}</small></span></button><button class="library-delete" data-delete="${escapeHTML(item.id)}" title="키맵 삭제" aria-label="${escapeHTML(item.name)} 삭제">${icon('trash')}</button></div>`).join('') : '<p class="empty-library">키맵을 만들고 저장해 보세요.</p>';
}
function renderBoard() {
  const model = currentModel();
  const gridIds = gridActionIds(model,0).flat();
  selected = Math.min(selected,actionCount(model));
  layer = Math.min(layer,profile.layers.length-1);
  $('#key-grid').innerHTML = gridIds.map(id => {
    const value = boardValue(id);
    return `<button class="keycap ${value.draft.type==='disabled'?'is-disabled':''} ${selected === id ? 'selected' : ''} ${value.draft.type==='preserve'&&!value.current?'is-preserve':''} ${value.changed?'has-change':''}" data-key="${id}" aria-label="키 ${id}: ${escapeHTML(value.title)}" aria-pressed="${selected === id}" title="${escapeHTML(value.title)}"><span class="key-inner"><span class="keycap-number">${String(id).padStart(2,'0')}</span>${value.changed?'<span class="key-change" aria-label="편집한 동작"></span>':''}${featureName(value.draft)?`<span class="keycap-function">${escapeHTML(featureName(value.draft))}</span>`:''}<span class="keycap-label">${escapeHTML(value.label)}</span></span></button>`;
  }).join('');
  $('#encoders').innerHTML = Array.from({length:model.encoders},(_,index) => {
    const base = model.keys + 1 + index * 3;
    const press = boardValue(base+1);
    return `<div class="encoder-block"><button class="encoder-knob ${selected === base+1 ? 'selected' : ''}" data-key="${base+1}" aria-label="다이얼 ${index+1} 누르기: ${escapeHTML(getLabel(getAction(base+1)))}" aria-pressed="${selected === base+1}" title="누르기 · ${escapeHTML(press.title)}"><span class="knob-label">${escapeHTML(press.label==='·'?'':press.label)}</span></button><div class="encoder-controls"><button class="encoder-turn ${selected === base ? 'selected' : ''}" data-key="${base}" aria-pressed="${selected === base}" aria-label="다이얼 ${index+1} 왼쪽 회전: ${escapeHTML(getLabel(getAction(base)))}" title="왼쪽 회전 · ${escapeHTML(boardValue(base).title)}">↶</button><span class="encoder-name">${String(index+1).padStart(2,'0')}</span><button class="encoder-turn ${selected === base+2 ? 'selected' : ''}" data-key="${base+2}" aria-pressed="${selected === base+2}" aria-label="다이얼 ${index+1} 오른쪽 회전: ${escapeHTML(getLabel(getAction(base+2)))}" title="오른쪽 회전 · ${escapeHTML(boardValue(base+2).title)}">↷</button></div></div>`;
  }).join('');
  $('.layers').innerHTML = profile.layers.map((item,index)=>`<button class="layer-tab" id="layer-tab-${index}" data-layer="${index}" role="tab" aria-selected="${index===layer}" tabindex="${index===layer?0:-1}" aria-controls="keyboard-layout">레이어 ${index+1}</button>`).join('');
  $('#rotation-angle').textContent=`${profile.rotation || 0}°`;
  $('[data-rotate="reset"]').disabled=busy || !(profile.rotation || 0);
  document.querySelectorAll('[data-rotate]').forEach(button=>{if(button.dataset.rotate!=='reset')button.disabled=busy;});
  $('#keyboard-layout').setAttribute('aria-labelledby', `layer-tab-${layer}`);
  $('#board-layer-label').textContent = `LAYER 0${layer+1}`;
  $('#board-model-label').textContent = `MINI / ${model.keys} + ${model.encoders}`;
  $('#model-select').value = model.id;
  $('#profile-meta').textContent = `${model.keys}키 / ${model.encoders}다이얼`;
  $('#model-note').textContent = model.verified ? 'USB 검증' : '실기 미검증';
  $('#model-note').classList.toggle('unverified',!model.verified);
  $('#paste-layer').disabled = !copiedLayer || copiedLayer.modelId !== model.id || copiedLayer.actions.length !== actionCount(model);
  layoutBoard();
}
function layoutBoard() {
  const model = currentModel();
  const angle = profile.rotation || 0;
  const width = model.columns*72+(model.columns-1)*10+((model.encoders>0)?104:0)+44;
  const faceHeight = Math.max(model.rows*72+(model.rows-1)*10, model.encoders*80+Math.max(0,model.encoders-1)*12);
  const height = faceHeight+65;
  const rotated = angle%180!==0;
  const rotatedWidth = rotated?height:width;
  const rotatedHeight = rotated?width:height;
  const stage=$('.hardware-stage');
  const fitViewport=matchMedia('(min-width: 1050px) and (min-height: 620px)').matches;
  const stageStyle=getComputedStyle(stage);
  const availableHeight=fitViewport?Math.max(100,stage.clientHeight-parseFloat(stageStyle.paddingTop)-parseFloat(stageStyle.paddingBottom)):405;
  const scale = Math.min(1,Math.max(180,stage.clientWidth-26)/rotatedWidth,availableHeight/rotatedHeight);
  const board = $('.keyboard');
  board.style.setProperty('--rotation',`${angle}deg`);
  board.style.setProperty('--counter-rotation',`${-angle}deg`);
  board.style.setProperty('--board-scale',String(scale));
  board.style.setProperty('--columns',String(model.columns));
  board.style.width = `${width}px`; board.style.height = `${height}px`;
  $('.hardware-face').style.height = `${faceHeight}px`;
  $('.board-shell').style.width = `${rotatedWidth*scale}px`;
  $('.board-shell').style.height = `${rotatedHeight*scale}px`;
}
function selectedName() {
  const model = currentModel();
  if (selected <= model.keys) return `키 ${String(selected).padStart(2,'0')}`;
  const offset = selected-model.keys-1;
  return `다이얼 ${Math.floor(offset/3)+1} · ${['왼쪽 회전','누르기','오른쪽 회전'][offset%3]}`;
}
function applicationName(id) {return APPLICATIONS.find(app=>app.id===(id||'system'))?.name||'지원하지 않는 앱';}
function applicationOptions(selected=null) {
  let html=APPLICATIONS.map(app=>`<option value="${app.id==='system'?'':app.id}">${escapeHTML(app.name)}</option>`).join('');
  if(selected&&!APPLICATIONS.some(app=>app.id===selected))html+=`<option value="${escapeHTML(selected)}">지원하지 않는 앱</option>`;
  return html;
}
function featureName(action) {
  if(action?.label)return action.label;
  return functionCatalog?.application.id===(shortcutApplicationId)?findShortcutLabel(functionCatalog,action):'';
}
async function loadProfileFunctions() {
  const id=shortcutApplicationId;
  if(functionCatalog?.application.id===id || functionLoading===id)return;
  functionLoading=id;functionError='';functionCatalog=null;
  try{
    if(!functionCatalogCache.has(id))functionCatalogCache.set(id,loadShortcutCatalog(id));
    const catalog=await functionCatalogCache.get(id);
    if((shortcutApplicationId)!==id)return;
    functionCatalog=catalog;functionGroup='';functionScroll=0;renderBoard();renderEditor();
  }catch{functionCatalogCache.delete(id);if((shortcutApplicationId)===id){functionError='기능 목록을 불러오지 못했습니다. 지원 앱을 다시 선택하세요.';renderFunctions();}}
  finally{if(functionLoading===id)functionLoading='';}
}
function renderFunctions() {
  const list=$('#function-list');if(!list)return;
  if(!functionCatalog){list.innerHTML=`<p class="function-empty">${escapeHTML(functionError||'기능 목록을 불러오는 중…')}</p>`;return;}
  const query=functionQuery.trim().toLocaleLowerCase();
  const groups=functionCatalog.groups.filter(group=>!functionGroup||group.id===functionGroup);
  const {label:ignored,...current}=getAction();
  list.innerHTML=groups.map(group=>{
    const items=group.items.filter(item=>!query||`${item.label} ${item.shortcut}`.toLocaleLowerCase().includes(query));
    if(!items.length)return '';
    return `<section class="function-group"><h3>${escapeHTML(group.name)}</h3>${items.map(item=>{const active=JSON.stringify(current)===JSON.stringify(item.action)&&(!getAction().label||getAction().label===item.label);return `<button class="function-option ${active?'selected':''}" data-function="${escapeHTML(item.id)}" title="${escapeHTML(item.warning||item.notes||item.label)}" aria-pressed="${active}"><span>${escapeHTML(item.label)}${item.warning?'<i class="function-caution" aria-label="사전 설정 필요">!</i>':''}</span><kbd>${escapeHTML(item.shortcut)}</kbd></button>`;}).join('')}</section>`;
  }).join('') || '<p class="function-empty">일치하는 기능이 없습니다.</p>';
  list.scrollTop=functionScroll;
  $('#function-setup').textContent=functionCatalog.setupInstructions.join(' ');
}
function chooseFunction(id) {
  if(busy){toast('장치 작업이 끝난 뒤 편집하세요.',true);return;}
  const item=functionCatalog?.groups.flatMap(group=>group.items).find(item=>item.id===id);
  if(!item)return;
  functionScroll=$('#function-list').scrollTop||0;
  const next=structuredClone(profile);next.layers[layer].actions[selected-1]={...structuredClone(item.action),label:item.label};
  profile=validateProfile(next);touch();renderBoard();renderEditor();
  if(item.warning)toast(item.warning);
}
function renderEditor() {
  recording = false;
  const action = getAction();
  $('#selection-caption').textContent = `레이어 ${layer+1} / ${selectedName()}`;
  $('#selection-badge').textContent = selected <= currentModel().keys ? `Key ${String(selected).padStart(2,'0')}` : `Dial ${Math.floor((selected-currentModel().keys-1)/3)+1}`;
  $('#action-editor').innerHTML = `<div class="editor-mode" role="group" aria-label="키 설정 방식"><button data-editor-mode="functions" aria-pressed="${editorMode==='functions'}">기능 선택</button><button data-editor-mode="manual" aria-pressed="${editorMode==='manual'}">직접 입력</button></div><section id="function-picker" ${editorMode==='functions'?'':'hidden'}><div class="function-current"><button class="quiet key-disable" data-action="disable-action" title="키 할당 삭제 · 사용 안 함" aria-label="키 할당 삭제">${icon('trash')}</button><strong>${escapeHTML(featureName(action)||getLabel(action))}</strong><span>${escapeHTML(actionLabel(action))}</span></div><div class="function-search"><label class="shortcut-app-field"><span>지원 앱</span><select id="shortcut-application" aria-label="지원 앱">${applicationOptions()}</select></label><label class="sr-only" for="function-search">기능 검색</label><input id="function-search" type="search" placeholder="기능 이름으로 검색" value="${escapeHTML(functionQuery)}" autocomplete="off"><label class="sr-only" for="function-group">기능 그룹</label><select id="function-group"><option value="">모든 기능</option>${(functionCatalog?.groups||[]).map(group=>`<option value="${escapeHTML(group.id)}">${escapeHTML(group.name)}</option>`).join('')}</select></div><div id="function-list" class="function-list"></div><div id="function-setup" class="function-setup"></div></section><section id="manual-editor" ${editorMode==='manual'?'':'hidden'}><label class="field"><span class="field-label">동작 종류</span><select id="action-type"><option value="preserve">원래 동작 유지</option><option value="key">키 / 조합키</option><option value="macro">순차 매크로</option><option value="media">미디어</option><option value="mouse">마우스</option><option value="disabled">사용 안 함</option></select></label><div id="action-fields"></div><div class="error-text" id="editor-error" role="alert"></div><div class="action-preview"><h3>장치의 현재 동작</h3><div class="preview-label">${escapeHTML(currentLabel(snapshotAction()))}</div>${boardValue(selected).changed?`<span class="draft-indicator">편집: ${escapeHTML(getLabel(action))}</span>`:''}</div></section><button class="quiet key-disable-manual" data-action="disable-action" ${editorMode==='manual'?'':'hidden'}>${icon('trash')}키 할당 삭제 · 사용 안 함</button>${keyLightingHTML(profile,layer,selected)}`;
  $('#shortcut-application').value=shortcutApplicationId==='system'?'':shortcutApplicationId;
  document.querySelectorAll('[data-key-led-color]').forEach(button=>{if(button.dataset.keyLedColor!=='preserve')button.style.backgroundColor=button.dataset.keyLedColor;});
  $('#action-type').value = action.type;
  renderFields(action);
  $('#function-group').value=functionGroup;renderFunctions();
}
function renderFields(action) {
  const node = $('#action-fields');
  const type = action.type;
  if (type === 'preserve') node.innerHTML = `<div class="action-description">${icon('lock')}장치의 동작 유지</div>`;
  else if (type === 'disabled') node.innerHTML = '<div class="action-description">입력 없음</div><div class="editor-bottom"><button class="primary" data-action="set-action">동작 설정</button></div>';
  else if (type === 'key') node.innerHTML = `<label class="field"><span class="field-label">키 조합</span><input id="key-combo" autocomplete="off" spellcheck="false" placeholder="예: CTRL + C" value="${escapeHTML((action.keys || []).join(' + '))}"></label><button class="capture-button" id="capture-button" data-action="capture">${icon('keyboard')}키 입력</button><div class="shortcut-list"><button data-preset="CTRL+C">복사</button><button data-preset="CTRL+V">붙여넣기</button><button data-preset="CTRL+Z">실행 취소</button><button data-preset="META+SPACE">검색</button></div><div class="editor-bottom"><button class="primary" data-action="set-action">동작 설정</button><button data-action="reset-action" title="원래 동작 유지로 변경">초기화</button></div>`;
  else if (type === 'macro') node.innerHTML = `<label class="field"><span class="field-label">순서대로 입력할 키</span><textarea id="macro-steps" spellcheck="false" placeholder="CTRL + C\nCTRL + V">${escapeHTML((action.steps || []).map(keys => keys.join(' + ')).join('\n'))}</textarea></label><span class="field-hint" title="위에서 아래로 실행합니다. 보조키 포함 최대 14개 입력. 대기 시간은 지원하지 않습니다.">한 줄에 한 동작 · 최대 14개 입력 ⓘ</span><div class="editor-bottom"><button class="primary" data-action="set-action">동작 설정</button><button data-action="reset-action">초기화</button></div>`;
  else {
    const choices = type === 'media' ? media : mouse;
    node.innerHTML = `<label class="field"><span class="field-label">${type === 'media' ? '미디어' : '마우스'} 동작</span><select id="action-key">${Object.entries(choices).map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></label><div class="editor-bottom"><button class="primary" data-action="set-action">동작 설정</button><button data-action="reset-action">초기화</button></div>`;
    if (action.key && choices[action.key]) $('#action-key').value = action.key;
  }
}
function fullRender() {
  $('#profile-name').value = profile.name;
  renderBoard(); renderEditor(); renderLibrary(); updateDeviceUI();
  loadProfileFunctions();
  $('#session-notice').hidden = !notice;
  $('#session-notice').textContent = notice;
}
function parseCombo(value) {
  const aliases = { CONTROL:'CTRL', CMD:'META', COMMAND:'META', WIN:'META', WINDOWS:'META', OPTION:'ALT', ESCAPE:'ESC', RETURN:'ENTER', SPACEBAR:'SPACE', ARROWUP:'UP', ARROWDOWN:'DOWN', ARROWLEFT:'LEFT', ARROWRIGHT:'RIGHT', BACKQUOTE:'GRAVE', EQUALS:'EQUAL' };
  return value.split('+').map(key => key.trim().toUpperCase()).filter(Boolean).map(key => aliases[key] || key);
}
function applyEditor() {
  try {
    const type = $('#action-type').value;
    let action = {type};
    if (type === 'key') action.keys = parseCombo($('#key-combo').value);
    if (type === 'macro') action.steps = $('#macro-steps').value.split(/\r?\n/).filter(value => value.trim()).map(parseCombo);
    if (type === 'media' || type === 'mouse') action.key = $('#action-key').value;
    const next = structuredClone(profile);
    next.layers[layer].actions[selected-1] = action;
    profile = validateProfile(next);
    touch(); renderBoard(); renderEditor();
    toast(`${selectedName()} 편집됨`);
  } catch (error) { $('#editor-error').textContent = explain(error); }
}
function validateCurrent() { profile.name = $('#profile-name').value.trim(); profile = validateProfile(profile); return profile; }
function download(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type:'application/json'}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function filename(value) { return String(value).replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,70) || 'keymap'; }
function backups() {
  const raw = localStorage.getItem(BACKUP_KEY) || '[]';
  if (raw.length > 5_000_000) throw new Error('백업 보관함이 너무 큽니다.');
  const value = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(item => item && typeof item === 'object'
    && typeof item.id === 'string' && item.id.length <= 100
    && typeof item.savedAt === 'string' && Number.isFinite(Date.parse(item.savedAt))
    && typeof item.deviceName === 'string' && item.deviceName.length <= 200
    && item.backup && typeof item.backup === 'object' && !Array.isArray(item.backup)))
    throw new Error('백업 보관함 형식이 올바르지 않습니다. 원본 보관함은 변경하지 않았습니다.');
  if (new Set(value.map(item => item.id)).size !== value.length) throw new Error('백업 ID가 중복됩니다.');
  return value;
}
async function persistBackup(backup) {
  // Never prune an existing backup automatically. A failed durable save must stop a device write.
  const previous = backups();
  const entry = { id:crypto.randomUUID(), savedAt:new Date().toISOString(), deviceName:device?.name || 'Mini Keyboard', backup:JSON.parse(JSON.stringify(backup)) };
  const encoded = JSON.stringify([entry,...previous]);
  try {
    localStorage.setItem(BACKUP_KEY, encoded);
    if (localStorage.getItem(BACKUP_KEY) !== encoded) throw new Error('저장한 백업을 다시 읽지 못했습니다.');
  } catch (error) { throw new Error('키·다이얼 동작 백업을 브라우저에 저장하지 못해 장치 기록을 중단했습니다. 저장 공간을 확인하고 기존 백업을 파일로 내보내 주세요.', {cause:error}); }
  return entry;
}
function renderBackups() {
  try {
    const list = backups();
    $('#backup-list').innerHTML = list.length ? list.map(item => `<div class="backup-row"><strong>${escapeHTML(item.deviceName)}</strong><p>${escapeHTML(dateLabel(item.savedAt))} · 적용 전 키·다이얼 동작</p><div class="backup-buttons"><button class="small" data-export-backup="${escapeHTML(item.id)}">파일 내보내기</button><button class="small" data-restore-backup="${escapeHTML(item.id)}" ${!device?.compatible || busy ? 'disabled' : ''}>장치에 복원</button><button class="quiet small danger" data-delete-backup="${escapeHTML(item.id)}" aria-label="${escapeHTML(dateLabel(item.savedAt))} 백업 삭제">삭제</button></div></div>`).join('') : '<p class="backup-empty">아직 백업이 없습니다. 키보드에 처음 적용할 때 키·다이얼 동작을 자동 보관합니다.</p>';
  } catch (error) { $('#backup-list').textContent = `백업을 읽지 못했습니다: ${explain(error)}`; }
}
function progress(message) { const text=typeof message==='string'?message:message?.message || JSON.stringify(message);$('#device-message').textContent=text;if(text)diagnostic(/실패|오류/.test(text)?'error':'info',text); }
function diagnostic(level,message,details={}) {
  const event={level,component:'device',message,details};
  globalThis.miniKeyboardDesktop?.log?.(event)?.catch(()=>{});
}
function requestRotation(direction) {
  if(busy || catalogDownloading){toast('진행 중인 작업이 끝난 뒤 방향을 변경하세요.',true);return;}
  const target=direction==='reset'?0:((profile.rotation||0)+(direction==='left'?270:90))%360;
  if(target===(profile.rotation||0))return;
  rotationChange={before:structuredClone(validateCurrent()),target};
  profile.rotation=target;touch();renderBoard();
  $('#rotation-target').textContent=`${target}°`;
  let reason='';
  try{
    if(!device?.compatible || device.modelId!==profile.modelId)throw Error('같은 모델의 키보드를 연결하면 키 재배치를 적용할 수 있습니다.');
    rotateProfileKeys(rotationChange.before,target,{currentActions:deviceSnapshot?.actions});
  }catch(error){reason=explain(error);}
  $('#rotation-reason').textContent=reason;$('#rotation-apply').disabled=Boolean(reason);
  $('#rotation-dialog').showModal();
}
async function applyRotation() {
  const change=rotationChange,targetDevice=device;
  if(!change || busy || catalogDownloading)return;
  if(!device?.compatible || device.modelId!==change.before.modelId)throw Error('같은 모델의 키보드를 먼저 연결하세요.');
  const next=rotateProfileKeys(change.before,change.target,{currentActions:deviceSnapshot?.actions});
  const keysOnly=structuredClone(next),keys=getModel(next.modelId).keys;
  keysOnly.layers.forEach(item=>{for(let i=keys;i<item.actions.length;i++)item.actions[i]={type:'preserve'};});
  $('#rotation-dialog').close();
  await withDeviceWork(async()=>{
    if(device!==targetDevice)throw Error('키보드 연결이 변경되었습니다. 다시 연결하세요.');
    diagnostic('info','rotation.apply.start',{rotation:change.target,layers:3,keys});
    const result=await applyKeymap(targetDevice,keysOnly,{companionCall,persistBackup,onProgress:progress});
    if(device!==targetDevice)throw Error('키보드 연결이 변경되었습니다.');
    profile=next;touch();fullRender();persistDraft();await refreshSnapshot();
    progress(`${result.changed}개 키 동작 재배치 · 저장 확인 완료${result.lightingModeChanged?" · 모드 효과 확인 필요":""}`);
    diagnostic('info','rotation.apply.complete',{rotation:change.target,changed:result.changed});
    toast(`키 배치를 적용했습니다. 노브 설정은 유지했습니다. ${lightingActivationNote(result)}`.trim());
  });
}
function openTool(id) {
  for(const name of ['files-dialog','devices-dialog']) if(name!==id && $(`#${name}`).open) $(`#${name}`).close();
  if(!$(`#${id}`).open)$(`#${id}`).showModal();
}
function updateDeviceUI() {
  const connected = Boolean(device);
  document.querySelectorAll('[data-rotate]').forEach(button=>{button.disabled=busy || (button.dataset.rotate==='reset' && !(profile.rotation||0));});
  $('#header-device-dot').classList.toggle('connected',connected);
  $('#header-device-label').textContent = connected ? '키보드 연결됨' : '장치 연결';
  $('#apply-device-label').textContent = connected ? (device.modelId ? getModel(device.modelId).name : device.name) : '장치 연결 전';
  $('#devices-dialog').classList.toggle('has-device',connected);
  $('#file-profile-name').textContent = profile.name;
  $('#connection-status').innerHTML = `<span class="status-dot ${connected ? 'connected' : ''}"></span>${escapeHTML(connected ? device.name || '키보드 연결됨' : '장치 연결 전')}`;
  $('[data-action="connect"]').innerHTML = `${icon('usb')}<span>${busy ? '처리 중…' : connected ? '연결 해제' : '키보드 연결'}</span>`;
  $('[data-action="connect"]').disabled = busy || ($('#transport-select').value === 'webhid' && !('hid' in navigator));
  $('#transport-select').disabled = busy || connected;
  $('#led-open-button').disabled = busy || device?.transport !== 'companion';
  $('#led-open-button').title = device?.transport === 'companion' ? '수동 상태·LED' : '보조앱 연결에서 사용';
  const modelMismatch = device && device.modelId !== profile.modelId;
  $('#apply-button').disabled = busy || !device?.compatible || modelMismatch;
  $('#read-device').disabled = busy || !device?.compatible;
  $('#apply-button').innerHTML = `${icon('usb')}${busy ? '처리 중…' : '장치에 적용'}`;
  $('#device-model-name').textContent = connected ? (device.modelId ? getModel(device.modelId).name : device.name || 'Mini Keyboard') : '키보드';
  if ($('#transport-select').value === 'webhid' && !('hid' in navigator)) $('#device-description').textContent = '장치 연결: 데스크톱 Chrome / Edge 필요';
  else if (connected && !device.compatible) $('#device-description').textContent = device.compatibilityReason || `연결한 장치의 기록 방식을 확인하지 못했습니다. 식별값: ${(device.identity || []).map(value => `0x${value.toString(16).padStart(2,'0')}`).join(' ')}. 키맵은 계속 편집할 수 있습니다.`;
  else if (modelMismatch) $('#device-description').textContent = `모델 다름: 장치 ${getModel(device.modelId).name} / 키맵 ${currentModel().name} · 설정 읽기로 전환`;
  else if (connected && device.verified === false) $('#device-description').textContent = `실기 미검증 · ${deviceSnapshot?'동작 읽음':'연결됨'}`;
  else if (connected) $('#device-description').textContent = `연결됨${deviceSnapshot?' · 현재 동작 표시 중':''}`;
  else $('#device-description').textContent = $('#transport-select').value==='companion'?'보조앱 연결 전':'USB 연결 전';
  document.body.classList.toggle('working',busy);
  renderCatalogCards();
}
async function withDeviceWork(work) {
  if (!device?.compatible || busy) return;
  busy = true; updateDeviceUI();
  try { await work(); }
  catch (error) { deviceSnapshot = null; renderBoard(); renderEditor(); progress(explain(error)); toast(explain(error),true); }
  finally { busy = false; updateDeviceUI(); renderBackups(); }
}
async function connect() {
  if (busy) return;
  if (device) {
    try { await device.disconnect(); progress('장치 연결을 해제했습니다.'); }
    catch(error) { progress(explain(error)); throw error; }
    finally { $('#lighting-dialog').close(); ledWriteAllowed=false; device = null; deviceSnapshot = null; renderBoard(); renderEditor(); updateDeviceUI(); }
    return;
  }
  busy = true; updateDeviceUI();
  try {
    device = await connectDevice({transport:$('#transport-select').value});
    if (device.compatible) { progress('동작 읽는 중…'); await refreshSnapshot(); progress(''); }
    else progress(device.compatibilityReason || '지원하지 않는 장치');
  }
  catch (error) { toast(`연결하지 못했습니다: ${explain(error)}`,true); progress(explain(error)); }
  finally { busy = false; updateDeviceUI(); }
}

document.addEventListener('click', async event => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  try {
    if(target.dataset.editorMode){editorMode=target.dataset.editorMode;renderEditor();return;}
    if(target.dataset.function){chooseFunction(target.dataset.function);return;}
    if(target.dataset.keyLedColor){if(busy)return;profile=updateKeyLighting(profile,layer,selected,{color:target.dataset.keyLedColor==='preserve'?null:target.dataset.keyLedColor});touch();renderEditor();return;}
    if (target.dataset.ledState) { await sendLEDState(target.dataset.ledState); return; }
    if (target.dataset.close) { $(`#${target.dataset.close}`).close(); return; }
    if (target.dataset.key) { selected = Number(target.dataset.key); renderBoard(); renderEditor(); $(`[data-key="${selected}"]`).focus({preventScroll:true}); return; }
    if (target.dataset.rotate) { requestRotation(target.dataset.rotate); return; }
    if (target.dataset.layer !== undefined) { layer = Number(target.dataset.layer); renderBoard(); renderEditor(); return; }
    if (target.dataset.preset) { $('#key-combo').value = target.dataset.preset.split('+').join(' + '); $('#key-combo').focus(); return; }
    if (target.dataset.open) { const saved = library.find(item => item.id === target.dataset.open); if (saved) { persistDraft(); profile = validateProfile(structuredClone(saved)); layer = 0; selected = 1; notice = ''; $('#session-notice').hidden = true; fullRender(); persistDraft(); toast('보관함에서 키맵을 열었습니다.'); } return; }
    if (target.dataset.delete) { deleteFromLibrary(target.dataset.delete); renderLibrary(); toast('보관함에서 삭제했습니다. 현재 편집 작업은 유지됩니다.'); return; }
    if (target.dataset.exportBackup) { const entry = backups().find(item => item.id === target.dataset.exportBackup); if (entry) download(entry.backup,`mini-keyboard-backup-${entry.savedAt.slice(0,10)}.json`); return; }
    if (target.dataset.deleteBackup) { const next = backups().filter(item => item.id !== target.dataset.deleteBackup); localStorage.setItem(BACKUP_KEY,JSON.stringify(next)); renderBackups(); toast('백업을 삭제했습니다.'); return; }
    if (target.dataset.restoreBackup) { const entry = backups().find(item => item.id === target.dataset.restoreBackup); if (entry) { $('#backups-dialog').close(); await withDeviceWork(async () => { const result = await device.restore(entry.backup,{persistBackup,onProgress:progress}); await refreshSnapshot(); progress(`${result.changed}개 동작 복원 · 재읽기 확인`); toast('백업을 복원하고 확인했습니다.'); }); } return; }
    if (['import','export','share'].includes(target.dataset.action)) $('#files-dialog').close();
    if (['lighting','backups','read-device'].includes(target.dataset.action)) $('#devices-dialog').close();
    switch (target.dataset.action) {
      case 'open-logs': if(globalThis.miniKeyboardDesktop?.openLogs)await miniKeyboardDesktop.openLogs();else toast('로그 저장은 데스크톱 앱에서 사용할 수 있습니다.'); break;
      case 'apply-rotation': await applyRotation(); break;
      case 'files': $('#file-profile-name').textContent=profile.name; openTool('files-dialog'); break;
      case 'devices': updateDeviceUI(); openTool('devices-dialog'); break;
      case 'input-debug': document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close()); await inputDebug.open(); break;
      case 'connect': await connect(); break;
      case 'lighting': await openLighting(); break;
      case 'read-lighting': await lightingWork(async()=>renderLightingReadings(await companionCall('readLighting'))); break;
      case 'restore-lighting': await lightingWork(async()=>{const result=await companionCall('restoreLighting'); $('#lighting-preview').hidden=false; $('#lighting-result-label').textContent=result.verified===true?'원래 LED 복원 확인':'복원 확인 대기'; $('#lighting-result-detail').textContent=''; $('#lighting-swatch').style.backgroundColor='#555555'; if(result.verified===true){$('#lighting-enabled').checked=false; renderLightingReadings(await companionCall('readLighting'));}}); await directLighting.refresh(); break;
      case 'new': if(busy)throw Error('장치 작업이 끝난 뒤 새 키맵을 만드세요.'); $('#new-profile-name').value='새 키맵';$('#new-profile-model').value=profile.modelId;$('#new-profile-dialog').showModal();$('#new-profile-name').focus();$('#new-profile-name').select();break;
      case 'save': validateCurrent(); touch(); saveToLibrary(profile); persistDraft(); renderLibrary(); toast('내 키맵에 저장했습니다.'); break;
      case 'export': validateCurrent(); download(profile,`${filename(profile.name)}.json`); break;
      case 'import': $('#import-file').value = ''; $('#import-file').click(); break;
      case 'share': validateCurrent(); $('#share-url').value = `${location.href.split('#')[0]}${encodeShare(profile)}`; $('#share-dialog').showModal(); break;
      case 'copy-share': try { if(globalThis.miniKeyboardDesktop?.version===1)await miniKeyboardDesktop.copyKeymap($('#share-url').value);else await navigator.clipboard.writeText($('#share-url').value); toast('공유 링크를 복사했습니다.'); } catch { $('#share-url').focus(); $('#share-url').select(); toast('링크를 선택했습니다. Ctrl+C 또는 ⌘C로 복사하세요.'); } break;
      case 'set-action': applyEditor(); break;
      case 'disable-action': if(busy)break;profile.layers[layer].actions[selected-1]={type:'disabled'};touch();renderBoard();renderEditor();break;
      case 'reset-action': profile.layers[layer].actions[selected-1] = {type:'preserve'}; touch(); renderBoard(); renderEditor(); break;
      case 'capture': recording = !recording; $('#capture-button').classList.toggle('recording',recording); $('#capture-button').textContent = recording ? '지금 키를 눌러 주세요 · Esc로 취소' : '키 입력'; $('#capture-button').focus(); break;
      case 'copy-layer': copiedLayer = {modelId:profile.modelId,actions:structuredClone(profile.layers[layer].actions),lighting:structuredClone(profile.layers[layer].lighting)}; $('#paste-layer').disabled = false; toast(`레이어 ${layer+1}의 ${actionCount(currentModel())}개 동작을 복사했습니다.`); break;
      case 'paste-layer': if (copiedLayer && copiedLayer.modelId === profile.modelId) { profile.layers[layer].actions = structuredClone(copiedLayer.actions);profile.layers[layer].lighting=structuredClone(copiedLayer.lighting??null); touch(); renderBoard(); renderEditor(); toast(`레이어 ${layer+1}에 붙여넣었습니다.`); } break;
      case 'presets': await openPresets(); break;
      case 'catalog-refresh': await loadCatalog(); break;
      case 'catalog-settings': await openCatalogSettings(); break;
      case 'catalog-clear-token': await clearCatalogToken(); break;
      case 'read-device': await withDeviceWork(async () => { progress('키·다이얼 동작을 읽고 있습니다…'); const backup = await device.readAll(); installSnapshot(backup); await persistBackup(backup); const { profileFromBackup } = await import('./device.js'); profile = validateProfile(await profileFromBackup(backup, '키보드에서 읽은 키맵')); profile.id = createProfile().id; layer = 0; selected = 1; notice = ''; fullRender(); persistDraft(); progress('동작을 읽고 백업했습니다.'); toast('현재 키보드 설정을 읽었습니다.'); }); break;
      case 'backups': renderBackups(); $('#backups-dialog').showModal(); break;
      case 'import-backup': $('#backup-file').value = ''; $('#backup-file').click(); break;
      case 'apply': if (device?.modelId !== profile.modelId) throw new Error('연결한 장치와 키맵의 모델이 다릅니다. 설정 읽기로 올바른 모델의 키맵을 열어 주세요.'); validateCurrent(); await withDeviceWork(async () => { persistDraft(); const result = await applyKeymap(device,profile,{companionCall,persistBackup,onProgress:progress}); await refreshSnapshot(); progress(`${result.changed}개 동작${result.lightingChanged?` · LED ${result.lightingChanged}개 레이어`:""} 저장 · 재읽기 확인${result.lightingModeChanged?" · 모드 효과 확인 필요":""}`); toast(`장치 설정을 저장하고 다시 읽어 확인했습니다. ${lightingActivationNote(result)}`.trim()); }); break;
    }
  } catch (error) { toast(explain(error),true); }
});
$('#rotation-dialog').addEventListener('close',()=>{rotationChange=null;});
$('#new-profile-form').addEventListener('submit',event=>{
  event.preventDefault();
  try{
    if(busy||catalogDownloading)throw Error('진행 중인 작업이 끝난 뒤 새 키맵을 만드세요.');
    const next=createProfile($('#new-profile-name').value.trim(),$('#new-profile-model').value);
    preserveAndOpen(validateProfile(next));functionQuery='';functionGroup='';editorMode='functions';$('#new-profile-dialog').close();fullRender();
  }catch(error){toast(explain(error),true);}
});
$('#action-editor').addEventListener('input',event=>{if(event.target.id==='function-search'){functionQuery=event.target.value;functionScroll=0;renderFunctions();}});
$('#transport-select').addEventListener('change',()=>updateDeviceUI());
$('#model-select').addEventListener('change', event => {
  const modelId = event.target.value;
  if (modelId === profile.modelId) return;
  try {
    validateCurrent(); saveToLibrary(profile);
    profile = createProfile('새 키맵',modelId); selected = 1; layer = 0;
    notice = '';
    fullRender(); persistDraft(); toast('모델을 변경했습니다. 이전 작업은 내 키맵에 보관했습니다.');
  } catch (error) { event.target.value = profile.modelId; toast(`이전 작업을 보관하지 못해 모델 변경을 취소했습니다: ${explain(error)}`,true); }
});
$('#profile-name').addEventListener('input', event => { profile.name = event.target.value; touch(); });
// Delegation is needed because selecting another physical control replaces the editor.
$('#action-editor').addEventListener('change', event => {
  if(event.target.id==='shortcut-application'){shortcutApplicationId=event.target.value||'system';functionQuery='';functionGroup='';functionCatalog=null;renderEditor();loadProfileFunctions();return;}
  if(event.target.id==='key-led-mode'){if(busy)return;profile=updateKeyLighting(profile,layer,selected,{mode:event.target.value==='preserve'?null:Number(event.target.value)});touch();return;}
  if(event.target.id==='function-group'){functionGroup=event.target.value;functionScroll=0;renderFunctions();return;}
  if (event.target.id !== 'action-type') return;
  recording = false;
  renderFields({type:event.target.value});
  $('#editor-error').textContent = '';
  if (event.target.value === 'preserve') { profile.layers[layer].actions[selected-1] = {type:'preserve'}; touch(); renderBoard(); renderEditor(); }
});
$('#action-editor').addEventListener('keydown', event => {
  if (!recording || event.target.id !== 'capture-button') return;
  event.preventDefault(); event.stopPropagation();
  if (event.key === 'Escape') { recording = false; $('#capture-button').classList.remove('recording'); $('#capture-button').textContent = '키 입력'; return; }
  if (['Control','Shift','Alt','Meta'].includes(event.key)) return;
  const names = {Space:'SPACE',Backspace:'BACKSPACE',Delete:'DELETE',Enter:'ENTER',Tab:'TAB',ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT',PageUp:'PAGE_UP',PageDown:'PAGE_DOWN',Home:'HOME',End:'END',Insert:'INSERT',Backquote:'GRAVE',Minus:'MINUS',Equal:'EQUAL',BracketLeft:'LEFT_BRACKET',BracketRight:'RIGHT_BRACKET',Backslash:'BACKSLASH',Semicolon:'SEMICOLON',Quote:'QUOTE',Comma:'COMMA',Period:'PERIOD',Slash:'SLASH',CapsLock:'CAPS_LOCK'};
  let key = names[event.code] || (/^Key[A-Z]$/.test(event.code) ? event.code.slice(3) : /^Digit\d$/.test(event.code) ? event.code.slice(5) : /^F\d+$/.test(event.code) ? event.code : null);
  if (!key) { $('#editor-error').textContent = '이 키는 자동으로 인식하지 못했습니다. 키 이름을 직접 입력하세요.'; return; }
  const keys = [...(event.ctrlKey ? ['CTRL'] : []),...(event.altKey ? ['ALT'] : []),...(event.shiftKey ? ['SHIFT'] : []),...(event.metaKey ? ['META'] : []),key];
  $('#key-combo').value = keys.join(' + '); recording = false; $('#capture-button').classList.remove('recording'); $('#capture-button').textContent = '키 입력'; $('#key-combo').focus();
});
$('.layers').addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); layer = event.key === 'Home' ? 0 : event.key === 'End' ? profile.layers.length-1 : (layer + (event.key === 'ArrowRight' ? 1 : profile.layers.length-1)) % profile.layers.length;
  renderBoard(); renderEditor(); $(`#layer-tab-${layer}`).focus();
});
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > MAX_FILE) throw new Error('128KB 이하의 키맵 JSON 파일을 선택하세요.');
    if (busy || catalogDownloading) throw new Error('장치 작업이 끝난 뒤 파일을 다시 열어 주세요.');
    const imported = validateProfile(JSON.parse(await file.text()));
    if (busy || catalogDownloading) throw new Error('장치 작업이 끝난 뒤 파일을 다시 열어 주세요.');
    preserveAndOpen(imported); toast('키맵을 가져왔습니다.');
  } catch (error) { toast(`파일을 가져오지 못했습니다: ${explain(error)}`,true); }
});
$('#backup-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > MAX_FILE) throw new Error('128KB 이하의 백업 JSON 파일을 선택하세요.');
    const value = JSON.parse(await file.text());
    await validateBackup(value,value?.identity);
    await persistBackup(value); renderBackups(); toast('백업 파일을 보관했습니다. 복원 시 장치와 키·다이얼 동작을 검증합니다.');
  } catch (error) { toast(`백업을 가져오지 못했습니다: ${explain(error)}`,true); }
});

let presets = [];
let catalogData = null;
let catalogAuth = null;
let catalogLoading = false;
let catalogDownloading = false;
let catalogAuthBusy = false;
const catalogAvailable = () => typeof globalThis.miniKeyboardDesktop?.catalog === 'function';
const catalogCall = (command, args = {}) => {
  if (!catalogAvailable()) throw new Error('GitHub 카탈로그는 데스크톱 앱에서 사용할 수 있습니다. 기본 샘플은 브라우저에서도 열 수 있습니다.');
  return globalThis.miniKeyboardDesktop.catalog(command, args);
};
const platformLabel = value => ({mac:'Mac',windows:'Windows',linux:'Linux',any:'공통'})[value] || value;
function catalogModelName(id) { return modelList.find(model => model.id === id)?.name || id; }
function catalogProposal(item) {
  return /바인딩 제안/.test(item.name || '') || (item.category === 'game' && (item.tags || []).some(tag => /binding.proposal|requires-game-rebinding|바인딩.제안/i.test(tag)));
}
function setCatalogTab(tab) {
  const bundled = tab === 'bundled';
  $('#catalog-remote').hidden = bundled;
  $('#catalog-bundled').hidden = !bundled;
  $('#catalog-github-tab').setAttribute('aria-selected', String(!bundled));
  $('#catalog-bundled-tab').setAttribute('aria-selected', String(bundled));
  $('#catalog-github-tab').tabIndex = bundled ? -1 : 0;
  $('#catalog-bundled-tab').tabIndex = bundled ? 0 : -1;
  $('#catalog-settings').hidden = bundled;
}
function renderCatalogAuth() {
  const label = !catalogAvailable() ? '데스크톱 앱에서 GitHub 연결 가능' : catalogAuth?.connected ? `GitHub 연결됨 · ${catalogAuth.method === 'gh' ? 'GitHub CLI' : '저장한 토큰'}` : 'GitHub 연결 필요';
  $('#catalog-auth').textContent = label;
  $('#catalog-token-status').textContent = label;
}
function renderCatalogCards() {
  // This also runs when a device connects, disconnects, or starts another operation.
  if (!$('#catalog-list')) return;
  const entries = catalogData?.manifest?.entries || [];
  const query = $('#catalog-search').value.trim().toLocaleLowerCase();
  const platform = $('#catalog-platform').value, model = $('#catalog-model').value;
  const filtered = entries.filter(item => (!platform || item.platform === platform || item.platform === 'any') && (!model || item.modelId === model) && `${item.name} ${item.description} ${(item.tags || []).join(' ')}`.toLocaleLowerCase().includes(query));
  $('#catalog-list').innerHTML = filtered.length ? filtered.map(item => {
    const unavailable = busy || catalogDownloading;
    const reason = busy ? '장치 작업이 끝난 뒤 적용하세요.' : !device ? '키보드를 먼저 연결하세요.' : !device.compatible ? '지원되는 키보드를 연결하세요.' : device.modelId !== item.modelId ? '연결한 키보드와 키맵 모델이 다릅니다.' : '현재 키·다이얼 동작을 백업한 뒤 적용합니다.';
    return `<article class="catalog-card"><div class="catalog-card-meta"><span>${escapeHTML(platformLabel(item.platform))}</span><span>${escapeHTML(catalogModelName(item.modelId))}</span><span>v${escapeHTML(item.version)}</span></div><h3>${escapeHTML(item.name)}</h3>${catalogProposal(item) ? '<span class="catalog-proposal">바인딩 제안</span>' : ''}<p title="${escapeHTML(item.description)}">${escapeHTML(item.description)}</p><div class="catalog-card-actions"><button class="small" data-catalog-open="${escapeHTML(item.id)}" ${unavailable?'disabled':''}>편집기로 열기</button><button class="small primary" data-catalog-apply="${escapeHTML(item.id)}" title="${escapeHTML(reason)}" ${unavailable || !device?.compatible || device.modelId !== item.modelId?'disabled':''}>다운로드·적용</button></div></article>`;
  }).join('') : `<p class="catalog-empty">${catalogLoading ? '카탈로그를 불러오는 중…' : catalogData ? '조건에 맞는 키맵이 없습니다.' : 'GitHub에 연결한 뒤 새로고침하세요. 기본 샘플도 바로 사용할 수 있습니다.'}</p>`;
  $('#catalog-refresh').disabled = catalogLoading || catalogDownloading;
}
async function loadCatalog() {
  if (catalogLoading || catalogDownloading) return;
  $('#catalog-result').textContent = '';
  if (!catalogAvailable()) {
    $('#catalog-status').textContent = 'GitHub 카탈로그는 데스크톱 앱에서 사용할 수 있습니다. 브라우저에서는 기본 샘플을 이용하세요.';
    renderCatalogAuth(); renderCatalogCards(); return;
  }
  catalogLoading = true; renderCatalogCards();
  $('#catalog-status').textContent = 'GitHub 카탈로그를 불러오는 중…';
  $('#catalog-status').classList.remove('catalog-warning');
  const results = await Promise.allSettled([catalogCall('list'), catalogCall('auth-status')]);
  if (results[1].status === 'fulfilled') catalogAuth = results[1].value;
  const result = results[0];
  if (result.status === 'fulfilled') {
    catalogData = result.value;
    const cached = catalogData.offline;
    $('#catalog-status').textContent = cached ? `오프라인 캐시 · ${dateLabel(catalogData.fetchedAt)}에 받은 목록입니다.${catalogData.warning ? ` ${catalogData.warning}` : ''}` : `${catalogData.manifest.entries.length}개 키맵 · ${dateLabel(catalogData.fetchedAt)} 확인`;
    $('#catalog-status').classList.toggle('catalog-warning', Boolean(cached));
  } else {
    $('#catalog-status').textContent = `${explain(result.reason)}${catalogData ? ' 이전에 불러온 목록을 표시합니다.' : ''}`;
    $('#catalog-status').classList.add('catalog-warning');
  }
  catalogLoading = false; renderCatalogAuth(); renderCatalogCards();
}
async function openPresets() {
  if (!$('#presets-dialog').open) $('#presets-dialog').showModal();
  setCatalogTab('github');
  $('#presets-list').textContent = '샘플을 불러오는 중…';
  const sampleWork = (async () => {
    try {
      const response = await fetch('./presets/index.json');
      if (!response.ok) throw new Error('샘플 목록을 불러오지 못했습니다.');
      presets = await response.json();
      if (!Array.isArray(presets)) throw new Error('샘플 목록 형식이 올바르지 않습니다.');
      $('#presets-list').innerHTML = presets.map((item,index) => `<article class="catalog-card"><div class="catalog-card-meta"><span>기본 샘플</span></div><h3>${escapeHTML(item.name)}</h3><p title="${escapeHTML(item.description)}">${escapeHTML(item.description)}</p><div class="catalog-card-actions"><button class="small" data-preset-index="${index}">편집기로 열기</button></div></article>`).join('');
    } catch (error) { $('#presets-list').textContent = explain(error); }
  })();
  await Promise.allSettled([loadCatalog(), sampleWork]);
}
function preserveAndOpen(incoming) {
  const next = validateProfile(incoming);
  next.id = createProfile().id;
  // Save the current editor first. If any subsequent save fails it remains recoverable.
  const current = validateProfile({...profile, name:$('#profile-name').value.trim()});
  saveToLibrary(current);
  saveToLibrary(next);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  clearTimeout(draftTimer);
  profile = next; layer = 0; selected = 1; notice = '';
  fullRender(); persistDraft();
}
function requireCatalogDevice(entry, expectedDevice = device) {
  if (!device || device !== expectedDevice) throw new Error('키보드 연결이 변경되었습니다. 다시 연결한 뒤 적용하세요.');
  if (!device.compatible) throw new Error(device.compatibilityReason || '지원되는 키보드를 연결하세요.');
  if (device.modelId !== entry.modelId) throw new Error('연결한 키보드와 키맵의 모델이 다릅니다.');
}
async function useCatalogEntry(id, apply) {
  if (catalogDownloading || busy || catalogLoading) return;
  const entry = catalogData?.manifest.entries.find(item => item.id === id);
  if (!entry) throw new Error('카탈로그를 새로고침한 뒤 다시 선택하세요.');
  const targetDevice = device;
  if (apply) requireCatalogDevice(entry, targetDevice);
  catalogDownloading = true; renderCatalogCards();
  $('#catalog-result').textContent = `${entry.name} 다운로드 중…`;
  const work = async () => {
    let activationNote='';
    const result = await catalogCall('download', {id});
    const next = validateProfile(result.profile);
    if (next.modelId !== entry.modelId) throw new Error('목록과 다운로드한 키맵 모델이 다릅니다. 카탈로그를 새로고침하세요.');
    if (apply) requireCatalogDevice(entry, targetDevice);
    else if (busy) throw new Error('장치 작업이 끝난 뒤 편집기로 다시 열어 주세요.');
    preserveAndOpen(next);
    if (apply) {
      // No await between the final device check and the existing apply pipeline.
      requireCatalogDevice(entry, targetDevice);
      const applied = await applyKeymap(targetDevice,profile,{companionCall,persistBackup,onProgress:progress});
      requireCatalogDevice(entry, targetDevice);
      await refreshSnapshot();
      activationNote=lightingActivationNote(applied);
      progress(`${applied.changed}개 동작 저장 · 재읽기 확인${applied.lightingModeChanged?' · 모드 효과 확인 필요':''}`);
    }
    const message = apply ? `키맵을 저장하고 다시 읽어 확인했습니다. ${activationNote}`.trim() : '키맵을 내 보관함에 저장하고 편집기로 열었습니다.';
    $('#catalog-result').textContent = message;
    $('#presets-dialog').close(); toast(message);
  };
  try {
    if (apply) await withDeviceWork(async () => {
      try { await work(); } catch (error) { $('#catalog-result').textContent = explain(error); throw error; }
    });
    else await work();
  } catch (error) { $('#catalog-result').textContent = explain(error); toast(explain(error), true); }
  finally { catalogDownloading = false; renderCatalogCards(); }
}
async function openCatalogSettings() {
  $('#catalog-token').value = ''; $('#catalog-token-error').textContent = '';
  if (catalogAvailable()) {
    try { catalogAuth = await catalogCall('auth-status'); } catch (error) { $('#catalog-token-error').textContent = explain(error); }
  }
  renderCatalogAuth();
  $('#catalog-save-token').disabled = !catalogAvailable();
  $('#catalog-clear-token').disabled = !catalogAvailable();
  $('#catalog-token').disabled = !catalogAvailable();
  $('#catalog-token-dialog').showModal();
}
function setCatalogAuthBusy(value) {
  catalogAuthBusy = value;
  $('#catalog-save-token').disabled = value;
  $('#catalog-clear-token').disabled = value;
  $('#catalog-token').disabled = value;
}
async function clearCatalogToken() {
  if (catalogAuthBusy) return;
  $('#catalog-token').value = ''; $('#catalog-token-error').textContent = '';
  setCatalogAuthBusy(true);
  try { catalogAuth = await catalogCall('clear-token'); renderCatalogAuth(); }
  catch (error) { $('#catalog-token-error').textContent = explain(error); }
  finally { setCatalogAuthBusy(false); }
}
$('#catalog-token-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (catalogAuthBusy) return;
  const token = $('#catalog-token').value.trim();
  $('#catalog-token').value = ''; $('#catalog-token-error').textContent = '';
  if (!token) return;
  setCatalogAuthBusy(true);
  try {
    catalogAuth = await catalogCall('save-token', {token}); renderCatalogAuth();
    $('#catalog-token-dialog').close(); await loadCatalog();
  } catch (error) { $('#catalog-token-error').textContent = explain(error); }
  finally { $('#catalog-token').value = ''; setCatalogAuthBusy(false); }
});
for (const eventName of ['close','cancel']) $('#catalog-token-dialog').addEventListener(eventName, () => { $('#catalog-token').value = ''; });
for (const id of ['catalog-search','catalog-platform','catalog-model']) $(`#${id}`).addEventListener(id === 'catalog-search' ? 'input' : 'change', renderCatalogCards);
$('.catalog-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const bundled = event.key === 'End' || (event.key !== 'Home' && $('#catalog-github-tab').getAttribute('aria-selected') === 'true');
  setCatalogTab(bundled ? 'bundled' : 'github');
  $(bundled ? '#catalog-bundled-tab' : '#catalog-github-tab').focus();
});
$('#presets-dialog').addEventListener('click', async event => {
  const tab = event.target.closest('[data-catalog-tab]');
  if (tab) { setCatalogTab(tab.dataset.catalogTab); return; }
  const remote = event.target.closest('[data-catalog-open],[data-catalog-apply]');
  if (remote && !remote.disabled) {
    try { await useCatalogEntry(remote.dataset.catalogOpen || remote.dataset.catalogApply, Boolean(remote.dataset.catalogApply)); }
    catch (error) { $('#catalog-result').textContent = explain(error); toast(explain(error),true); }
    return;
  }
  const target = event.target.closest('[data-preset-index]');
  if (!target || busy || catalogDownloading) return;
  try {
    const item = presets[Number(target.dataset.presetIndex)];
    const url = new URL(item.file,new URL('./presets/',location.href));
    if (url.origin !== location.origin || !url.pathname.startsWith(new URL('./presets/',location.href).pathname)) throw new Error('잘못된 템플릿 파일 경로입니다.');
    const response = await fetch(url); if (!response.ok) throw new Error('템플릿 파일을 읽지 못했습니다.');
    const text = await response.text(); if (new Blob([text]).size > MAX_FILE) throw new Error('템플릿 파일이 너무 큽니다.');
    if (busy || catalogDownloading) return;
    preserveAndOpen(JSON.parse(text));
    $('#presets-dialog').close(); toast('샘플을 편집기로 열었습니다.');
  } catch (error) { $('#catalog-result').textContent = explain(error); toast(explain(error),true); }
});

if ('hid' in navigator) navigator.hid.addEventListener('disconnect', event => { if (device && (!device.hidDevice || event.device === device.hidDevice)) { device = null; deviceSnapshot = null; $('#lighting-dialog').close(); renderBoard(); renderEditor(); updateDeviceUI(); progress('USB 연결이 끊어졌습니다. 케이블을 확인한 뒤 다시 연결하세요.'); } });
function lightingRules() {
  return ledStates.map(item=>({source:'manual',state:item.state,layer:Number($(`[data-led-layer="${item.state}"]`).value),mode:1,color:$(`[data-led-color="${item.state}"]`).value}));
}
function updateRuleColors() {
  document.querySelectorAll('[data-led-rule]').forEach(row=>row.style.setProperty('--state-color',$(`[data-led-color="${row.dataset.ledRule}"]`).value));
}
function storeLightingRules() {
  updateRuleColors();
  try { localStorage.setItem(LED_RULES_KEY,JSON.stringify(lightingRules())); }
  catch { $('#lighting-error').textContent='색·레이어 설정을 브라우저에 보관하지 못했습니다.'; }
}
async function openLighting() {
  if(device?.transport!=='companion'||busy)return;
  ledWriteAllowed=false;
  $('#lighting-enabled').checked=false;
  $('#lighting-enabled').indeterminate=false;
  $('#lighting-enabled').disabled=true;
  $('#lighting-capability').textContent='연결 확인 중';
  $('#lighting-error').textContent='';
  $('#lighting-preview').hidden=true;
  $('#lighting-readings').replaceChildren();
  $('#lighting-dialog').showModal();
  try {
    const raw=localStorage.getItem(LED_RULES_KEY);
    if(raw){const rules=JSON.parse(raw);if(Array.isArray(rules))for(const rule of rules){if(!ledStates.some(item=>item.state===rule.state))continue;if(/^#[0-9a-f]{6}$/i.test(rule.color))$(`[data-led-color="${rule.state}"]`).value=rule.color;if([0,1,2].includes(rule.layer))$(`[data-led-layer="${rule.state}"]`).value=String(rule.layer);}}
  }catch {$('#lighting-error').textContent='저장된 LED 규칙을 불러오지 못했습니다.';}
  updateRuleColors();
  await lightingWork(async()=>{
    const status=await companionCall('status');
    ledWriteAllowed=status.capabilities?.lightingWrite===true||status.lightingWrite===true;
    $('#lighting-enabled').checked=status.rulesEnabled===true;
    $('#lighting-enabled').disabled=!ledWriteAllowed;
    $('#lighting-capability').textContent=status.rulesEnabled?'상태 규칙 사용 중':ledWriteAllowed?'LED 설정 가능':'읽기 전용';
  });
  await directLighting.refresh();
}
async function lightingWork(work,{propagate=false}={}) {
  if(busy||device?.transport!=='companion')return;
  busy=true;updateDeviceUI();
  $('#lighting-error').textContent='';
  document.querySelectorAll('#lighting-dialog button,#lighting-dialog input,#lighting-dialog select').forEach(control=>control.disabled=true);
  try{await work();}
  catch(error){$('#lighting-preview').hidden=true;$('#lighting-error').textContent=explain(error);if($('#lighting-capability').textContent==='연결 확인 중'){$('#lighting-enabled').indeterminate=true;$('#lighting-capability').textContent='설정 확인 실패';}if(propagate)throw error;}
  finally{busy=false;updateDeviceUI();document.querySelectorAll('#lighting-dialog button,#lighting-dialog input,#lighting-dialog select').forEach(control=>control.disabled=false);$('#lighting-enabled').disabled=!ledWriteAllowed;}
}
async function syncLightingEnabled(enabled) {
  try {
    const result=await companionCall('configure',{enabled,rules:lightingRules()});
    if(result.enabled!==enabled)throw new Error('보조앱의 LED 사용 설정을 확인하지 못했습니다.');
    $('#lighting-enabled').checked=enabled;
    $('#lighting-enabled').indeterminate=false;
    $('#lighting-capability').textContent=enabled?'수동 LED 적용':ledWriteAllowed?'미리보기 모드':'미리보기 전용';
  } catch(error) {
    $('#lighting-enabled').indeterminate=true;
    ledWriteAllowed=false;
    $('#lighting-capability').textContent='설정 동기화 실패';
    throw error;
  }
}
async function sendLEDState(state) {
  if(!ledStates.some(item=>item.state===state))return;
  await lightingWork(async()=>{
    const enabled=$('#lighting-enabled').checked&&ledWriteAllowed;
    await syncLightingEnabled(enabled);
    const result=await companionCall('state',{event:{version:1,source:'manual',state}});
    const desired=result.desired;
    $('#lighting-preview').hidden=false;
    $('#lighting-result-label').textContent=result.preview===true?'미리보기':result.verified===true?'장치 저장 확인':result.queued===true?'처리 대기':'상태 확인';
    $('#lighting-result-detail').textContent=desired?`레이어 ${desired.layer+1} · 모드 ${desired.mode}`:'';
    const color=desired?.colors?.[0];
    $('#lighting-swatch').style.backgroundColor=/^#[0-9a-f]{6}$/i.test(color||'')?color:'#555555';
  });
}
function renderLightingReadings(result) {
  if(!Array.isArray(result.layers)||result.layers.length!==3)throw new Error('장치 LED 응답을 확인할 수 없습니다.');
  $('#lighting-readings').innerHTML=result.layers.map((item,index)=>`<div class="lighting-reading"><span>L${index+1}<small>모드 ${escapeHTML(item.mode)}</small></span><div class="led-color-grid" data-led-reading="${index}">${Array.from({length:16},(_,position)=>`<i title="LED ${position+1}" aria-label="LED ${position+1}"></i>`).join('')}</div></div>`).join('');
  result.layers.forEach((item,index)=>{const squares=$(`[data-led-reading="${index}"]`).children;Array.from(squares).forEach((square,position)=>{const color=item.colors?.[position];square.style.backgroundColor=/^#[0-9a-f]{6}$/i.test(color||'')?color:'#555555';square.title=`LED ${position+1}: ${color||'알 수 없음'}`;});});
}
$('#lighting-rules').addEventListener('change',storeLightingRules);
$('#lighting-enabled').addEventListener('change',async()=>{const enabled=$('#lighting-enabled').checked&&ledWriteAllowed;await lightingWork(()=>syncLightingEnabled(enabled));});
window.addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#keymap=')) return;
  try {
    const shared = decodeShare(location.hash);
    shared.id = createProfile().id;
    profile = shared; layer = 0; selected = 1;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    notice = '';
    fullRender(); persistDraft();
    if (!draftFailed) history.replaceState(null,'',location.pathname+location.search);
    toast('공유 키맵을 열었습니다.');
  } catch (error) { toast(`공유 링크를 열 수 없습니다: ${explain(error)}`,true); }
});
window.addEventListener('beforeunload', () => { if (draftTimer) persistDraft(); });
const directLighting=initLightingEditor({container:$('#direct-lighting-editor'),companionCall,getDevice:()=>device,getBusy:()=>busy,runExclusive:work=>lightingWork(work,{propagate:true}),onApplied:async()=>renderLightingReadings(await companionCall('readLighting'))});
const inputDebug=initInputDebug({getContext:()=>({profile,layer,selected}),readSnapshot:async()=>{if(busy)throw Error('장치 작업 중');let result=null;await withDeviceWork(async()=>{await refreshSnapshot();result=deviceSnapshot;});return result;},download});
fullRender();
if (sharedAtStartup) { persistDraft(); if (!draftFailed) history.replaceState(null,'',location.pathname+location.search); }
new ResizeObserver(()=>layoutBoard()).observe($('.hardware-stage'));
if (!isSecureContext) { notice = '장치 연결에는 HTTPS 또는 localhost가 필요합니다. 로컬 서버에서 이 페이지를 열어 주세요.'; $('#session-notice').textContent = notice; $('#session-notice').hidden = false; }
if(globalThis.miniKeyboardDesktop?.version===1){
  $('#transport-select').value='companion';$('.transport-field').hidden=true;updateDeviceUI();
  miniKeyboardDesktop.onAction?.(action=>{
    if(!isAppAction(action))return;
    if(busy || catalogDownloading){toast('진행 중인 작업이 끝난 뒤 다시 선택하세요.',true);return;}
    const button=$(`[data-action="${action}"]`);
    if(!button || button.disabled)return;
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    button.click();
  });
  miniKeyboardDesktop.onKeymap(url=>{
    if(busy){toast('장치 작업이 끝난 뒤 공유 링크를 다시 열어 주세요.',true);return;}
    try{const target=new URL(url);if(target.protocol==='mini-keyboard:'&&target.hostname==='studio'&&target.hash.startsWith('#keymap='))location.hash=target.hash;}catch(error){toast(explain(error),true);}
  });
  try{await seedDesktopLibrary();renderLibrary();}catch(error){toast(explain(error),true);}
  await connect();
}

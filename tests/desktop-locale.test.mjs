import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {SUPPORTED_LOCALES,normalizeLocale,validateLanguageInvocation,nativeText,nativeMenuTemplates} from '../desktop/locale.mjs';
import {appMenuGroups} from '../src/navigation.js';

test('desktop locale defaults normalize system regions and reject unsupported IPC values',()=>{
 for(const [input,expected] of [['ko-KR','ko'],['ja_JP','ja'],['es-MX','es'],['en-US','en'],['zh','zh-CN'],['zh-SG','zh-CN'],['zh-Hans-CN','zh-CN'],['zh-TW','zh-TW'],['zh-Hant-HK','zh-TW'],['zh-HK','zh-TW'],['fr-FR','en'],[null,'en']])assert.equal(normalizeLocale(input),expected);
 assert.equal(validateLanguageInvocation([]),null);
 for(const locale of SUPPORTED_LOCALES)assert.equal(validateLanguageInvocation([locale]),locale);
 for(const args of [[undefined],['fr'],['zh'],['KO'],['en','ko'],[{}],[null]])assert.throws(()=>validateLanguageInvocation(args),/language/i);
});

test('all six native menus retain action identifiers, accelerators, language self names and handlers',()=>{
 const names=['English','한국어','日本語','Español','简体中文','繁體中文'];
 const groupLabels=new Set();
 for(const locale of SUPPORTED_LOCALES){
  const actions=[],changes=[];
  const menus=nativeMenuTemplates({locale,appName:'Studio',connected:true,recoveryRequired:true,login:{openAtLogin:true,status:'requires-approval'},apiEnabled:true,packaged:true,handlers:{action:id=>actions.push(id),language:id=>changes.push(id)}});
  const group=menus.application.find(item=>item.id==='menu:file');groupLabels.add(group.label);
  for(const source of appMenuGroups.flatMap(group=>group.items)){
   const item=menus.application.flatMap(group=>group.submenu||[]).find(item=>item.id===source.action);
   assert.ok(item,`${locale}: ${source.action}`);assert.equal(item.accelerator,source.accelerator);assert.ok(item.label);item.click();
  }
  assert.deepEqual(actions,appMenuGroups.flatMap(group=>group.items.map(item=>item.action)));
  const languages=menus.tray.find(item=>item.id==='language').submenu;
  assert.deepEqual(languages.map(item=>item.label),names);assert.equal(languages.filter(item=>item.checked).length,1);
  for(const item of languages)item.click();assert.deepEqual(changes,SUPPORTED_LOCALES);
  assert.equal(menus.tray.at(-1).accelerator,'Command+Q');assert.ok(menus.tooltip);
  for(const key of ['quitWarning','backupDetail','returnToApp','quit','startupError','quitting','authBusy','invalidLink','applicationError'])assert.ok(nativeText(locale,key));
 }
 assert.equal(groupLabels.size,6);
});

test('preload language methods use exact IPC contract and remove subscriptions',async()=>{
 let exposed;const calls=[],listeners=new Map();
 vm.runInNewContext(await readFile(new URL('../desktop/preload.cjs',import.meta.url),'utf8'),{require:()=>({contextBridge:{exposeInMainWorld:(_name,value)=>{exposed=value;}},ipcRenderer:{invoke:(...args)=>{calls.push(args);return Promise.resolve('ja');},on:(channel,listener)=>listeners.set(channel,listener),removeListener:(channel,listener)=>{assert.equal(listeners.get(channel),listener);listeners.delete(channel);}}})});
 assert.equal(await exposed.getLanguage(),'ja');await exposed.setLanguage('ko');assert.deepEqual(calls,[['mini:language'],['mini:language','ko']]);
 let received;const unsubscribe=exposed.onLanguage(value=>{received=value;});listeners.get('mini:language-changed')({},'es');assert.equal(received,'es');unsubscribe();assert.equal(listeners.size,0);
});

test('every native role has a label in the selected language while retaining its role',()=>{
 const roles=['about','hide','hideOthers','unhide','undo','redo','cut','copy','paste','selectAll','resetZoom','zoomIn','zoomOut','togglefullscreen'];
 const labels={
  en:['About Studio','Hide Studio','Hide Others','Show All','Undo','Redo','Cut','Copy','Paste','Select All','Actual Size','Zoom In','Zoom Out','Toggle Full Screen'],
  ko:['Studio 정보','Studio 가리기','기타 가리기','모두 보기','실행 취소','실행 복귀','오려두기','복사하기','붙여넣기','모두 선택','실제 크기','확대','축소','전체 화면 전환'],
  ja:['Studioについて','Studioを非表示','ほかを非表示','すべてを表示','取り消す','やり直す','カット','コピー','ペースト','すべてを選択','実際のサイズ','拡大','縮小','フルスクリーン切り替え'],
  es:['Acerca de Studio','Ocultar Studio','Ocultar otras','Mostrar todo','Deshacer','Rehacer','Cortar','Copiar','Pegar','Seleccionar todo','Tamaño real','Ampliar','Reducir','Alternar pantalla completa'],
  'zh-CN':['关于 Studio','隐藏 Studio','隐藏其他','全部显示','撤销','重做','剪切','复制','粘贴','全选','实际大小','放大','缩小','切换全屏'],
  'zh-TW':['關於 Studio','隱藏 Studio','隱藏其他','全部顯示','復原','重做','剪下','拷貝','貼上','全選','實際大小','放大','縮小','切換全螢幕']
 };
 for(const locale of SUPPORTED_LOCALES){
  const menu=nativeMenuTemplates({locale,appName:'Studio'});
  const items=menu.application.flatMap(group=>group.submenu||[]).filter(item=>item.role);
  assert.deepEqual(items.map(item=>item.role),roles);
  assert.deepEqual(items.map(item=>item.label),labels[locale]);
  assert.ok(items.every(item=>!Object.hasOwn(item,'click')&&!Object.hasOwn(item,'accelerator')),'Electron retains role behavior and default shortcuts');
 }
});

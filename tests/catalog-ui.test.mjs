import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as profileApi from '../src/profile.js';
import * as modelApi from '../src/models.js';
import * as rotationApi from '../src/rotation.js';
import * as shortcutApi from '../src/shortcuts.js';
import * as keyLightingApi from '../src/key-lighting-ui.js';
import {applyKeymap,lightingActivationNote} from '../src/apply-keymap.js';
const root=new URL('../',import.meta.url).pathname;
const original=await fs.readFile(root+'src/app.js','utf8');
const source=original.replace(/^import .*;\n/gm,'').split("\nif ('hid' in navigator)")[0];
const nodes=new Map();
const node=key=>{if(!nodes.has(key))nodes.set(key,{value:'',textContent:'',innerHTML:'',className:'',hidden:false,disabled:false,open:false,dataset:{},style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},focus(){},select(){},append(){}});return nodes.get(key);};
const document={querySelector:node,querySelectorAll:selector=>selector==='[data-rotate]'?['left','right','reset'].map(direction=>{const n=node('[data-rotate='+direction+']');n.dataset.rotate=direction;return n;}):[],addEventListener(){},body:node('body')};
const values=new Map();const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.localStorage=localStorage;
const deps={...profileApi,...modelApi,...rotationApi,...shortcutApi,...keyLightingApi,applyKeymap,lightingActivationNote,document,localStorage,location:{hash:'',href:'http://127.0.0.1:4173/'},navigator:{},connectDevice(){throw Error('No real device access');},companionCall(){throw Error('No HID');},decodeAction(){},fromHex(){},validateBackup(){}};
let calls=[];let callback;const diagnosticEvents=[];
globalThis.miniKeyboardDesktop={log:async event=>diagnosticEvents.push(event),catalog:async(cmd,args)=>{calls.push([cmd,args]);return callback(cmd,args);}};
const harness=`
fullRender=()=>{};renderBoard=()=>{};renderEditor=()=>{};renderBackups=()=>{};refreshSnapshot=async()=>{await device.readAll()};
return {chooseFunction,requestRotation,applyRotation,useCatalogEntry,preserveAndOpen,loadCatalog,renderCatalogCards,receiveConnectionStatus,invalidatePendingConnection,
 getDevice:()=>device,setConnecting:value=>connecting=value,
 setDevice:d=>device=d,setBusy:b=>busy=b,setProfile:p=>{profile=p;$('#profile-name').value=p.name},
 setCatalog:d=>catalogData=d,setFunctions:d=>functionCatalog=d,getProfile:()=>profile,getBusy:()=>busy};`;
const ui=await new (Object.getPrototypeOf(async function(){}).constructor)(...Object.keys(deps),source+harness)(...Object.values(deps));
const current=profileApi.createProfile('내 작업');const incoming=profileApi.createProfile('다운로드 키맵');const entry={id:'test',name:'Test',description:'test',modelId:incoming.modelId,platform:'mac',version:'1',tags:[]};
ui.setProfile(current);ui.setCatalog({manifest:{entries:[entry]}});
callback=()=>{throw Error('CONFIDENTIAL_MACRO_CONTENT')};await ui.useCatalogEntry('test',false);assert.equal(ui.getProfile().id,current.id);assert.equal(profileApi.loadLibrary().length,0);assert(!JSON.stringify(diagnosticEvents).includes('CONFIDENTIAL_MACRO_CONTENT'));
callback=()=>({profile:incoming,entry,source:'github'});await ui.useCatalogEntry('test',false);assert.notEqual(ui.getProfile().id,incoming.id);assert.equal(profileApi.loadLibrary().length,2);assert(profileApi.loadLibrary().some(p=>p.id===current.id));assert.equal(JSON.parse(values.get('mini-keyboard-studio:draft:v1')).id,ui.getProfile().id);
let writes=0,reads=0;const device={compatible:true,modelId:incoming.modelId,name:'Fake',apply:async(p,opts)=>{writes++;assert.equal(typeof opts.persistBackup,'function');assert.equal(ui.getBusy(),true);return {changed:3}},readAll:async()=>{reads++}};
ui.setDevice(device);callback=()=>{assert(ui.getBusy());return {profile:incoming,entry}};
await ui.useCatalogEntry('test',true);assert.equal(writes,1);assert.equal(reads,1);assert.equal(ui.getBusy(),false);assert.equal(node('[data-rotate=left]').disabled,false);
callback=()=>{ui.setDevice(null);return {profile:incoming,entry}};await ui.useCatalogEntry('test',true);assert.equal(writes,1);assert.equal(ui.getBusy(),false);assert(node('#catalog-result').textContent.includes('연결'));
ui.setDevice({...device,modelId:'mini-3x1'});const before=calls.length;await assert.rejects(ui.useCatalogEntry('test',true),/모델/);assert.equal(calls.length,before);
ui.setDevice(device);ui.setBusy(true);await ui.useCatalogEntry('test',true);assert.equal(calls.length,before);ui.setBusy(false);
callback=cmd=>cmd==='auth-status'?{connected:true,method:'gh'}:{manifest:{entries:[entry]},offline:true,fetchedAt:new Date().toISOString(),warning:'cached'};await ui.loadCatalog();assert(node('#catalog-status').textContent.includes('오프라인 캐시'));
node('#catalog-search').value='missing';ui.renderCatalogCards();assert(node('#catalog-list').innerHTML.includes('조건에 맞는'));
console.log('PASS: failed download preservation, independent saved ids, library+draft persistence, locked apply+readback, disconnect/model/busy guards, offline warning, search empty state. Fake device only; no HID used.');

const rotate=profileApi.createProfile('회전 검증');rotate.layers.forEach(l=>l.actions=l.actions.map(()=>({type:'key',keys:['A']})));
ui.setProfile(rotate);ui.setDevice({...device,apply:async(p)=>{assert(p.layers.every(l=>l.actions.slice(16).every(a=>a.type==='preserve')));return {changed:48}}});
node('#profile-name').value=rotate.name;ui.requestRotation('left');assert.equal(ui.getProfile().rotation,270);await ui.applyRotation();assert.equal(ui.getProfile().rotation,270);assert.deepEqual(ui.getProfile().layers[0].actions.slice(16),rotate.layers[0].actions.slice(16));
console.log('PASS: rotation applies all pad layers with knobs excluded from writes.');

// Distinct actions catch permutation mistakes that identical A assignments hide.
const distinct=profileApi.createProfile('회전 위치 검증');
distinct.layers.forEach(item=>item.actions=item.actions.map((_,index)=>({type:'key',keys:[String.fromCharCode(65+index%26)]})));
let rotatedWrite;
ui.setProfile(distinct);ui.setDevice({...device,apply:async value=>{rotatedWrite=structuredClone(value);return {changed:48};}});
ui.requestRotation('left');await ui.applyRotation();
assert.equal(rotatedWrite.rotation,270);
assert.equal(rotatedWrite.layers[0].actions.slice(0,16).map(action=>action.keys[0]).join(''),'ABCDEFGHIJKLMNOP','rotating the device must not counter-rotate its assignments');
assert.equal(ui.getProfile().layers[0].actions[3].keys[0],'D','screen top-left follows physical K4 after a left turn');
assert.deepEqual(ui.getProfile().layers[0].actions.slice(16),distinct.layers[0].actions.slice(16));
assert.equal(JSON.parse(values.get('mini-keyboard-studio:draft:v1')).layers[0].actions[3].keys[0],'D');


ui.setProfile(profileApi.createProfile('기능 편집'));ui.setDevice(null);ui.setFunctions({application:{id:'system'},groups:[{id:'navigation',name:'탐색',items:[{id:'enter',label:'선택 항목 열기',action:{type:'key',keys:['ENTER']},shortcut:'Enter'}]}],setupInstructions:[]});
ui.chooseFunction('enter');assert.deepEqual(ui.getProfile().layers[0].actions[0],{type:'key',keys:['ENTER'],label:'선택 항목 열기'});assert.equal(Object.hasOwn(ui.getProfile(),'applicationId'),false);
console.log('PASS: selecting a named function assigns its shortcut to the selected pad key without device writes.');

// A real main-process presence event must clear the stale connected renderer.
const attached=()=>({transport:'companion',compatible:true,modelId:incoming.modelId,name:'Fake USB',hidDevice:{opened:true},close(){throw Error('Presence may not close devices');}});
let usb=attached();ui.setDevice(usb);ui.setBusy(false);
ui.receiveConnectionStatus({connected:false,connectionState:'disconnected',connectionRevision:9,sequence:10});
assert.equal(ui.getDevice(),null);assert.equal(usb.hidDevice.opened,false);assert.equal(node('#header-device-label').textContent,'장치 연결');assert.equal(node('#apply-button').disabled,true);
usb=attached();ui.setDevice(usb);ui.setBusy(true);
ui.receiveConnectionStatus({connected:false,connectionState:'unknown',connectionRevision:1,sequence:11});
assert.equal(ui.getDevice(),usb);assert.equal(usb.hidDevice.opened,false);
ui.setBusy(false);ui.invalidatePendingConnection();assert.equal(ui.getDevice(),null);
usb=attached();ui.setDevice(usb);ui.receiveConnectionStatus({connected:false,connectionState:'disconnected',sequence:10});
assert.equal(ui.getDevice(),usb,'stale main events cannot invalidate a newer connection');
ui.setConnecting(true);ui.receiveConnectionStatus({connected:false,sequence:12});assert.equal(ui.getDevice(),usb);
ui.setConnecting(false);ui.receiveConnectionStatus({connected:false,sequence:13});assert.equal(ui.getDevice(),null);
console.log('PASS: unplug clears connected UI, busy operations defer invalidation, helper revision resets remain accepted, and stale/connect-time events are safe.');

import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as profileApi from '../src/profile.js';
import * as modelApi from '../src/models.js';
const root=new URL('../',import.meta.url).pathname;
const original=await fs.readFile(root+'src/app.js','utf8');
const source=original.replace(/^import .*;\n/gm,'').split("\nif ('hid' in navigator)")[0];
const nodes=new Map();
const node=key=>{if(!nodes.has(key))nodes.set(key,{value:'',textContent:'',innerHTML:'',className:'',hidden:false,disabled:false,open:false,dataset:{},style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},focus(){},select(){},append(){}});return nodes.get(key);};
const document={querySelector:node,querySelectorAll:()=>[],addEventListener(){},body:node('body')};
const values=new Map();const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.localStorage=localStorage;
const deps={...profileApi,...modelApi,document,localStorage,location:{hash:'',href:'http://127.0.0.1:4173/'},navigator:{},connectDevice(){throw Error('No real device access');},companionCall(){throw Error('No HID');},decodeAction(){},fromHex(){},validateBackup(){}};
let calls=[];let callback;
globalThis.miniKeyboardDesktop={catalog:async(cmd,args)=>{calls.push([cmd,args]);return callback(cmd,args);}};
const harness=`
fullRender=()=>{};renderBoard=()=>{};renderEditor=()=>{};renderBackups=()=>{};refreshSnapshot=async()=>{await device.readAll()};
return {useCatalogEntry,preserveAndOpen,loadCatalog,renderCatalogCards,
 setDevice:d=>device=d,setBusy:b=>busy=b,setProfile:p=>{profile=p;$('#profile-name').value=p.name},
 setCatalog:d=>catalogData=d,getProfile:()=>profile,getBusy:()=>busy};`;
const ui=await new (Object.getPrototypeOf(async function(){}).constructor)(...Object.keys(deps),source+harness)(...Object.values(deps));
const current=profileApi.createProfile('내 작업');const incoming=profileApi.createProfile('다운로드 키맵');const entry={id:'test',name:'Test',description:'test',modelId:incoming.modelId,platform:'mac',version:'1',tags:[]};
ui.setProfile(current);ui.setCatalog({manifest:{entries:[entry]}});
callback=()=>{throw Error('network failed')};await ui.useCatalogEntry('test',false);assert.equal(ui.getProfile().id,current.id);assert.equal(profileApi.loadLibrary().length,0);
callback=()=>({profile:incoming,entry,source:'github'});await ui.useCatalogEntry('test',false);assert.notEqual(ui.getProfile().id,incoming.id);assert.equal(profileApi.loadLibrary().length,2);assert(profileApi.loadLibrary().some(p=>p.id===current.id));assert.equal(JSON.parse(values.get('mini-keyboard-studio:draft:v1')).id,ui.getProfile().id);
let writes=0,reads=0;const device={compatible:true,modelId:incoming.modelId,name:'Fake',apply:async(p,opts)=>{writes++;assert.equal(typeof opts.persistBackup,'function');assert.equal(ui.getBusy(),true);return {changed:3}},readAll:async()=>{reads++}};
ui.setDevice(device);callback=()=>{assert(ui.getBusy());return {profile:incoming,entry}};
await ui.useCatalogEntry('test',true);assert.equal(writes,1);assert.equal(reads,1);assert.equal(ui.getBusy(),false);
callback=()=>{ui.setDevice(null);return {profile:incoming,entry}};await ui.useCatalogEntry('test',true);assert.equal(writes,1);assert.equal(ui.getBusy(),false);assert(node('#catalog-result').textContent.includes('연결'));
ui.setDevice({...device,modelId:'mini-3x1'});const before=calls.length;await assert.rejects(ui.useCatalogEntry('test',true),/모델/);assert.equal(calls.length,before);
ui.setDevice(device);ui.setBusy(true);await ui.useCatalogEntry('test',true);assert.equal(calls.length,before);ui.setBusy(false);
callback=cmd=>cmd==='auth-status'?{connected:true,method:'gh'}:{manifest:{entries:[entry]},offline:true,fetchedAt:new Date().toISOString(),warning:'cached'};await ui.loadCatalog();assert(node('#catalog-status').textContent.includes('오프라인 캐시'));
node('#catalog-search').value='missing';ui.renderCatalogCards();assert(node('#catalog-list').innerHTML.includes('조건에 맞는'));
console.log('PASS: failed download preservation, independent saved ids, library+draft persistence, locked apply+readback, disconnect/model/busy guards, offline warning, search empty state. Fake device only; no HID used.');

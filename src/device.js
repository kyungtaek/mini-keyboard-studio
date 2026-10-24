import {VID,PID,outputPayload,normalizeInput,encodeAction,decodeAction,validateRecords,createBackup,validateBackup,toHex} from './protocol.js';
import {createProfile,validateProfile} from './profile.js';
import {actionCount,getModel} from './models.js';
import {isMiniKeyboard,matchFirmware,deviceFilters} from './registry.js';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const same=(a,b)=>toHex(a.slice(2,51))===toHex(b.slice(2,51));

export class MiniKeyboard{
 constructor(hidDevice){
  this.hidDevice=hidDevice;this.name=hidDevice.productName||'Mini Keyboard';this.identity=[];this.compatible=false;this.busy=false;this.modelId=null;this.transport='webhid';
  this.onInput=e=>{
   if(!this.pending||e.reportId!==3)return;
   try{const r=normalizeInput(e.reportId,e.data);this.pending.receive(r);}catch(error){this.pending?.reject(error);}
  };
  this.onDisconnect=()=>this.pending?.reject(Error('장치 연결이 끊어졌습니다. USB 연결 후 백업을 확인하세요.'));
  hidDevice.addEventListener('inputreport',this.onInput);
 }
 async initialize(){
  if(!isMiniKeyboard(this.hidDevice.vendorId,this.hidDevice.productId))throw Error('지원하는 Mini Keyboard 장치가 아닙니다.');
  await this.identify();return this;
 }
 async identify(){
  const [r]=await this.collect([3,251,251,251],r=>r[1]===251,1);
  const identity=[...r.slice(2,5)];
  if(this.identity.length&&this.identity.some((x,i)=>x!==identity[i]))throw Error('연결된 장치의 모델 응답이 바뀌었습니다. 다시 연결하세요.');
  this.identity=identity;const match=matchFirmware(this.hidDevice.vendorId,this.hidDevice.productId,identity);
  this.modelId=match.modelId;this.compatible=match.writable;this.verified=match.verified;this.compatibilityReason=match.reason;return identity;
 }
 async send(prefix){if(!this.hidDevice.opened)throw Error('장치가 연결되어 있지 않습니다.');await this.hidDevice.sendReport(3,outputPayload(prefix));await wait(30);}
 async collect(prefix,predicate,count){
  if(this.pending)throw Error('장치 응답을 기다리고 있습니다.');
  let pending;
  const promise=new Promise((resolve,reject)=>{
   const records=[],seen=new Set();const timer=setTimeout(()=>finish(Error('장치 응답 시간 초과. MINI_KEYBOARD 앱을 닫고 USB 연결과 브라우저 권한을 확인하세요.')),2500);
   const finish=(error)=>{clearTimeout(timer);if(this.pending===pending)this.pending=null;error?reject(error):resolve(records);};
   pending={reject:finish,receive:r=>{
    if(!predicate(r))return;
    if(count>1&&seen.has(r[2]))return finish(Error('중복된 동작 ID 응답을 받았습니다.'));
    seen.add(r[2]);records.push(r);if(records.length===count)finish();
   }};this.pending=pending;
  });
  // Attach rejection handling before asynchronous send can fail or time out.
  const result=promise.then(value=>({value}),error=>({error}));
  try{await this.send(prefix);}catch(error){pending.reject(error);}
  const settled=await result;if(settled.error)throw settled.error;return settled.value;
 }
 async readLayer(layer){
  const model=getModel(this.modelId),count=actionCount(model);
  const records=await this.collect([3,250,count,model.encoders,layer],r=>r[1]===250&&r[3]===layer,count);
  records.sort((a,b)=>a[2]-b[2]);
  if(records.some((r,i)=>r[2]!==i+1))throw Error(`동작 ID 1–${count} 전체를 받지 못했습니다.`);return records;
 }
 async capture(){
  await this.identify();
  if(!this.compatible)throw Error('지원되지 않은 모델입니다. 모델 변경은 자동 실행하지 않습니다.');
  const layers=[];for(let l=1;l<=3;l++)layers.push(await this.readLayer(l));validateRecords(layers,this.modelId);return layers;
 }
 async exclusive(fn){
  if(this.busy)throw Error('장치 설정 작업이 진행 중입니다.');this.busy=true;
  try{
   const run=async()=>{
    await this.hidDevice.beginTransaction?.();let result;
    try{result=await fn();}
    catch(error){
     try{await this.hidDevice.abortTransaction?.();}
     catch(recoveryError){throw Error(`${error.message}. 보조앱 원본 복구 확인 실패: ${recoveryError.message}. 연결을 다시 시도해 백업을 복구하세요.`);}
     throw error;
    }
    await this.hidDevice.endTransaction?.();return result;
   };
   if(globalThis.navigator?.locks)return await navigator.locks.request('mini-keyboard-514c-8850',{ifAvailable:true},lock=>{if(!lock)throw Error('다른 탭에서 장치 설정 중입니다.');return run();});
   return await run();
  }finally{this.busy=false;}
 }
 get backupInfo(){return {vid:this.hidDevice.vendorId,pid:this.hidDevice.productId,modelId:this.modelId};}
 async readAll(){return this.exclusive(async()=>createBackup(await this.capture(),this.identity,this.backupInfo));}
 async writeRecord(r){
  // FD firmware writes only active entries; media also retains the keyboard timing
  // field. Prime all 14 triples and the timing byte before installing the final type.
  const stage=r.slice();stage[4]=1;stage[6]=14;
  await this.send([3,253,...stage.slice(2,51)]);
  if(r[4]!==1||r[6]!==14)await this.send([3,253,...r.slice(2,51)]);
 }
 async commit(){for(const p of [[3,170,170],[3,253,254,255],[3,170,170]])await this.send(p);await wait(120);}
 async verifyLayer(layer,expected){
  const actual=await this.readLayer(layer);
  const failed=actual.flatMap((r,i)=>same(r,expected[i])?[]:[i+1]);
  if(failed.length){
   const error=Error(`레이어 ${layer}의 저장 확인 실패 (동작 ${failed.join(', ')})`);
   error.diagnostic={layer,actions:failed,offsets:actual.flatMap((r,i)=>failed.includes(i+1)?[{action:i+1,bytes:Array.from({length:49},(_,j)=>j+2).filter(offset=>r[offset]!==expected[i][offset])}]:[])};
   throw error;
  }
 }
 async transaction(before,after,{persistBackup,onProgress=()=>{}}){
  if(typeof persistBackup!=='function')throw Error('원본 백업 저장 경로가 필요합니다.');
  const notify=message=>{try{onProgress(message);}catch{/* UI reporting must not interrupt hardware recovery. */}};
  const changed=after.map((layer,l)=>layer.flatMap((r,i)=>same(r,before[l][i])?[]:[i]));
  const total=changed.flat().length;if(!total){notify('장치 설정이 이미 동일합니다.');return {changed:0};}
  const backup=await createBackup(before,this.identity,this.backupInfo);
  await persistBackup(backup);notify(`원본 ${before.flat().length}개 키 동작 백업 저장 완료`);
  const touched=[];
  try{
   for(let l=0;l<3;l++){
    if(!changed[l].length)continue;touched.push(l);notify(`레이어 ${l+1} 적용 중`);
    for(const i of changed[l])await this.writeRecord(after[l][i]);
    await this.commit();await this.verifyLayer(l+1,after[l]);notify(`레이어 ${l+1} 재읽기 검증 완료`);
   }
   return {changed:total,backup};
  }catch(error){
   const failures=[];try{globalThis.miniKeyboardDesktop?.log?.({level:'error',component:'device',message:error.message,details:error.diagnostic||{phase:'write'}})?.catch(()=>{});}catch{}notify('적용에 실패해 원본 설정을 복원합니다.');
   for(const l of touched){
    try{for(const r of before[l])await this.writeRecord(r);await this.commit();await this.verifyLayer(l+1,before[l]);}
    catch(rollbackError){failures.push(`레이어 ${l+1}: ${rollbackError.message}`);}
   }
   throw Error(`${error.message}. ${failures.length?'자동 복원 확인 실패 — USB를 다시 연결하고 저장된 백업으로 복원하세요. '+failures.join('; '):'원본 복원과 재읽기 확인 완료.'}`);
  }
 }
 async apply(value,options={}){
  const profile=validateProfile(value);
  if(profile.modelId!==this.modelId)throw Error('키맵과 연결된 장치의 모델이 다릅니다.');
  return this.exclusive(async()=>{
   const before=await this.capture();
   const after=before.map((layer,l)=>layer.map((r,i)=>encodeAction(r,profile.layers[l].actions[i])));
   return this.transaction(before,after,options);
  });
 }
 async restore(backup,options={}){
  return this.exclusive(async()=>{
   await this.identify();const saved=await validateBackup(backup,this.identity,this.backupInfo);
   const before=await this.capture();return this.transaction(before,saved,options);
  });
 }
 async disconnect(){
  if(this.busy)throw Error('설정 기록과 검증이 끝난 뒤 연결을 해제하세요.');
  this.hidDevice.removeEventListener('inputreport',this.onInput);
  try{if(this.hidDevice.opened)await this.hidDevice.close();}finally{this.compatible=false;}
 }
}
export async function connectDevice({transport='webhid'}={}){
 if(transport==='companion'){const {connectCompanionDevice}=await import('./companion.js');return connectCompanionDevice();}
 if(!globalThis.isSecureContext)throw Error('HTTPS 또는 localhost에서 열어 주세요.');
 if(!globalThis.navigator?.hid)throw Error('Chrome 또는 Edge 데스크톱에서 열어 주세요.');
 const granted=await navigator.hid.getDevices();
 const matching=granted.filter(d=>isMiniKeyboard(d.vendorId,d.productId)&&d.collections.some(c=>c.usagePage===0xff00&&c.usage===1));
 const devices=matching.length===1?matching:await navigator.hid.requestDevice({filters:deviceFilters()});
 const hid=devices.find(d=>d.collections.some(c=>c.usagePage===0xff00&&c.usage===1));
 if(!hid)throw Error('선택된 설정용 장치가 없습니다. USB 케이블로 연결한 뒤 다시 선택하세요.');
 if(!hid.opened)await hid.open();const controller=new MiniKeyboard(hid);
 try{return await controller.initialize();}catch(error){await controller.disconnect();throw error;}
}
export async function profileFromBackup(backup,name='기기에서 읽은 키맵'){
 const layers=await validateBackup(backup,backup.identity);const p=createProfile(name,backup.modelId||'mini-16x3');
 p.layers.forEach((layer,l)=>{layer.actions=layers[l].map(r=>{
  const action=decodeAction(r);
  // Preserve records carrying vendor fields or timing modes not represented by
  // our portable schema instead of silently changing them on the next apply.
  return same(encodeAction(r,action),r)?action:{type:'preserve'};
 });});return validateProfile(p);
}

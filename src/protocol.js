// Protocol reconstructed from MINI_KEYBOARD, with full-record preservation and
// byte contracts corroborated by the k8850_4x4 driver. See docs/research.md.
import {getModel,actionCount} from './models.js';
import {isMiniKeyboard,matchFirmware} from './registry.js';
export const VID=0x514c, PID=0x8850, REPORT_ID=3;
export const KEY_CODES=Object.fromEntries(Array.from({length:26},(_,i)=>[String.fromCharCode(65+i),4+i]));
Object.assign(KEY_CODES,Object.fromEntries(Array.from({length:9},(_,i)=>[String(i+1),30+i])),{'0':39});
Object.assign(KEY_CODES,Object.fromEntries(Array.from({length:24},(_,i)=>['F'+(i+1),i<12?58+i:104+i-12])));
Object.assign(KEY_CODES,{ENTER:40,ESC:41,BACKSPACE:42,TAB:43,SPACE:44,MINUS:45,EQUAL:46,LEFT_BRACKET:47,RIGHT_BRACKET:48,BACKSLASH:49,SEMICOLON:51,QUOTE:52,GRAVE:53,COMMA:54,PERIOD:55,SLASH:56,CAPS_LOCK:57,PRINT_SCREEN:70,SCROLL_LOCK:71,PAUSE:72,INSERT:73,HOME:74,PAGE_UP:75,DELETE:76,END:77,PAGE_DOWN:78,RIGHT:79,LEFT:80,DOWN:81,UP:82});
export const MODIFIERS={CTRL:241,SHIFT:242,ALT:243,META:244,RCTRL:245,RSHIFT:246,RALT:247,RMETA:248};
const MEDIA={PLAY_PAUSE:0xcd,STOP:0xb7,NEXT_TRACK:0xb5,PREVIOUS_TRACK:0xb6,MUTE:0xe2,VOLUME_UP:0xe9,VOLUME_DOWN:0xea};
const reverse=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[v,k]));
const names=reverse({...KEY_CODES,...MODIFIERS});
export function physicalActionId(row,col){if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>3||col<0||col>3)throw Error('키 위치 오류');return col*4+4-row;}
export function outputPayload(prefix){
 if(prefix[0]!==3||prefix.length>65)throw Error('잘못된 보고서');
 if(prefix[1]===0xfc)throw Error('모델 변경 명령은 지원하지 않습니다.');
 const r=new Uint8Array(64);r.set(prefix.slice(1));return r;
}
export function normalizeInput(reportId,data){
 if(reportId!==3)throw Error('잘못된 보고서 ID');
 const bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
 // WebHID data excludes reportId. Some test/native transports include it.
 if(bytes.length===65&&bytes[0]===3)return bytes.slice(0,64);
 if(bytes.length<63)throw Error('너무 짧은 설정 보고서');
 const r=new Uint8Array(64);r[0]=3;r.set(bytes.slice(0,63),1);return r;
}
function recordCheck(r){if(!(r instanceof Uint8Array)||r.length!==64||r[0]!==3||r[1]!==250||r[2]<1||r[2]>60||r[3]<1||r[3]>3)throw Error('설정 레코드가 올바르지 않습니다.');}
export function encodeAction(raw,action){
 recordCheck(raw);if(action.type==='preserve')return raw.slice();
 const r=raw.slice();r.fill(0,4,51);
 if(action.type==='disabled'){r[4]=1;return r;}
 if(action.type==='key'||action.type==='macro'){
  const steps=action.type==='key'?[action.keys]:action.steps;const codes=[];
  if(!Array.isArray(steps)||!steps.length)throw Error('빈 매크로');
  for(const keys of steps){
   if(!Array.isArray(keys)||!keys.length)throw Error('빈 키 조합');
   const modifiers=keys.filter(k=>k in MODIFIERS),regular=keys.filter(k=>!(k in MODIFIERS));
   if(regular.length>1)throw Error('조합당 일반 키 하나를 선택하세요.');
   for(const k of [...modifiers,...regular]){const c=MODIFIERS[k]??KEY_CODES[k];if(c===undefined)throw Error('지원하지 않는 키: '+k);codes.push(c);}
   // A zero usage terminates a modifier-only chord inside a sequence.
   if(!regular.length&&action.type==='macro')codes.push(0);
  }
  if(codes.length>14)throw Error('매크로는 수정 키를 포함해 14개 항목까지 가능합니다.');
  r[4]=1;r[5]=raw[4]===1?raw[5]:0;r[6]=codes.length;codes.forEach((c,i)=>r[9+i*3]=c);return r;
 }
 if(action.type==='media'){
  const code=MEDIA[action.key];if(code===undefined)throw Error('지원하지 않는 미디어 키');
  r[4]=2;r[6]=2;r[9]=code&255;r[12]=code>>8;return r;
 }
 if(action.type==='mouse'){
  r[4]=3;r[5]=1;r[6]=4;
  const buttons={LEFT_CLICK:1,RIGHT_CLICK:2,MIDDLE_CLICK:4};
  if(action.key in buttons)r[12]=buttons[action.key];
  else if(action.key==='SCROLL_UP')r[21]=1;
  else if(action.key==='SCROLL_DOWN')r[21]=255;
  else throw Error('지원하지 않는 마우스 동작');return r;
 }
 throw Error('지원하지 않는 동작');
}
export function decodeAction(r){
 recordCheck(r);
 if(r[4]===1){
  if(r[6]===0)return {type:'disabled'};
  if(r[6]>14)return {type:'preserve'};
  const steps=[];let chord=[];
  for(let i=0;i<r[6];i++){
   if(r[7+i*3]||r[8+i*3])return {type:'preserve'};
   const code=r[9+i*3];if(code===0){if(chord.length)steps.push(chord);chord=[];continue;}
   const name=names[code];if(!name)return {type:'preserve'};chord.push(name);
   if(!(name in MODIFIERS)){steps.push(chord);chord=[];}
  }
  if(chord.length)steps.push(chord);
  return steps.length===1?{type:'key',keys:steps[0]}:steps.length?{type:'macro',steps}:{type:'disabled'};
 }
 if(r[4]===2&&r[6]===2){const key=reverse(MEDIA)[r[9]|r[12]<<8];if(key)return {type:'media',key};}
 if(r[4]===3&&r[6]===4){
  // Preserve modified buttons, movement, and compound mouse actions.
  if(r[9]||r[15]||r[18])return {type:'preserve'};
  const key=!r[21]?({1:'LEFT_CLICK',2:'RIGHT_CLICK',4:'MIDDLE_CLICK'})[r[12]]:!r[12]?({1:'SCROLL_UP',255:'SCROLL_DOWN'})[r[21]]:undefined;
  if(key)return {type:'mouse',key};
 }
 return {type:'preserve'};
}
export function validateRecords(layers,modelId='mini-16x3'){
 const count=actionCount(getModel(modelId));
 if(!Array.isArray(layers)||layers.length!==3)throw Error('3개 레이어가 필요합니다.');
 layers.forEach((records,l)=>{
  if(!Array.isArray(records)||records.length!==count)throw Error(`각 레이어에 ${count}개 동작이 필요합니다.`);
  records.forEach((r,i)=>{recordCheck(r);if(r[2]!==i+1||r[3]!==l+1)throw Error('동작 ID 또는 레이어가 일치하지 않습니다.');});
 });return layers;
}
export const toHex=r=>Array.from(r,x=>x.toString(16).padStart(2,'0')).join('');
export function fromHex(s){if(typeof s!=='string'||s.length!==128||!/^[0-9a-f]+$/i.test(s))throw Error('백업 보고서 형식 오류');return Uint8Array.from(s.match(/../g),x=>parseInt(x,16));}
async function digest(layers){return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(layers)))));}
export async function createBackup(layers,identity,info={}){
 const modelId=info.modelId||'mini-16x3';validateRecords(layers,modelId);const serialized=layers.map(records=>records.map(toHex));
 return {format:'mini-keyboard-backup',version:2,modelId,createdAt:new Date().toISOString(),vid:info.vid??VID,pid:info.pid??PID,identity:[...identity],layers:serialized,sha256:await digest(serialized)};
}
export async function validateBackup(b,identity,info={}){
 if(!b||b.format!=='mini-keyboard-backup'||![1,2].includes(b.version)||!isMiniKeyboard(b.vid,b.pid))throw Error('호환되는 전체 백업 파일이 아닙니다.');
 if(!Array.isArray(identity)||identity.length!==3||!Array.isArray(b.identity)||b.identity.length!==3||b.identity.some((v,i)=>v!==identity[i]))throw Error('백업과 연결된 장치의 모델이 다릅니다.');
 const modelId=b.version===1?'mini-16x3':b.modelId;const count=actionCount(getModel(modelId));
 if((info.vid!==undefined&&info.vid!==b.vid)||(info.pid!==undefined&&info.pid!==b.pid)||(info.modelId&&info.modelId!==modelId)||matchFirmware(b.vid,b.pid,b.identity).modelId!==modelId)throw Error('백업과 연결된 장치의 USB 식별자 또는 모델이 다릅니다.');
 if(!Array.isArray(b.layers)||b.layers.length!==3||b.layers.some(l=>!Array.isArray(l)||l.length!==count))throw Error(`백업은 레이어당 ${count}개 동작을 포함해야 합니다.`);
 const layers=validateRecords(b.layers.map(l=>l.map(fromHex)),modelId);
 if(await digest(b.layers)!==b.sha256)throw Error('백업 해시(digest)가 일치하지 않습니다.');return layers;
}

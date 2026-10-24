import {mkdirSync,appendFileSync,statSync,renameSync,unlinkSync,chmodSync} from 'node:fs';
import path from 'node:path';
const levels=new Set(['info','warn','error']);
const sensitive=/token|authorization|password|secret|cookie|credential|serial|keymap|raw|payload|report|bindings/i;
function cleanText(value){return String(value)
 .replace(/\b(serial(?:Number)?|keymap|raw(?:Data)?|payload|bindings|hidReport)["']?\s*[:=][^\n]*/gi,'$1=[REDACTED]')
 .replace(/\bBearer\s+[^\s"'<>]+/gi,'Bearer [REDACTED]')
 .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/g,'[REDACTED]')
 .replace(/\b(token|authorization|password|secret|serial(?:Number)?|keymap|raw(?:Data)?)["']?\s*[:=]\s*(?:"[^"\n]*"|'[^'\n]*'|[^\s,;]+)/gi,'$1=[REDACTED]')
 .replace(/#keymap=[A-Za-z0-9_-]+/g,'#keymap=[REDACTED]').slice(0,2048);}
function clean(value,depth=0,seen=new WeakSet()){
 if(typeof value==='string')return cleanText(value);
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(typeof value!=='object')return '[unsupported]';
 if(depth>4)return '[truncated]';
 if(seen.has(value))return '[circular]';seen.add(value);
 if(value instanceof Error)return {name:cleanText(value.name),message:cleanText(value.message),stack:cleanText(value.stack||'')};
 if(Array.isArray(value))return value.slice(0,16).map(item=>clean(item,depth+1,seen));
 const output={};for(const [key,item] of Object.entries(value).slice(0,24)){if(sensitive.test(key)){output[key]='[REDACTED]';continue;}output[cleanText(key).slice(0,80)]=clean(item,depth+1,seen);}return output;
}
export function sanitizeLogEvent(event){
 const result={level:levels.has(event?.level)?event.level:'info',component:cleanText(event?.component||'main').slice(0,64),message:cleanText(event?.message||'')};
 if(event?.details!==undefined)result.details=clean(event.details);
 if(Buffer.byteLength(JSON.stringify(result))>3800)result.details='[truncated]';
 return result;
}
export function validateLogEvent(event){
 if(!event||typeof event!=='object'||Array.isArray(event)||Object.keys(event).some(key=>!['level','component','message','details'].includes(key))||!levels.has(event.level)||typeof event.component!=='string'||!/^[-a-zA-Z0-9_.]{1,64}$/.test(event.component)||typeof event.message!=='string'||!event.message||event.message.length>2048||(event.details!==undefined&&(!event.details||typeof event.details!=='object'||Array.isArray(event.details))))throw Error('허용되지 않은 로그 형식');
 let encoded;try{encoded=JSON.stringify(event);}catch{throw Error('허용되지 않은 로그 형식');}
 if(Buffer.byteLength(encoded)>4096)throw Error('로그 크기 제한 초과');
 return sanitizeLogEvent(event);
}
export function createDiagnosticLogger({directory,maxBytes=2*1024*1024}={}){
 const file=path.join(directory,'studio.jsonl');let queue=Promise.resolve();
 function writeSync(event){
  mkdirSync(directory,{recursive:true,mode:0o700});
  let entry={timestamp:new Date().toISOString(),...sanitizeLogEvent(event)};
  let line=JSON.stringify(entry)+'\n';
  if(Buffer.byteLength(line)>maxBytes){entry={timestamp:entry.timestamp,level:entry.level,component:entry.component,message:'Log entry exceeds file limit'};line=JSON.stringify(entry)+'\n';}
  let size=0;try{size=statSync(file).size;}catch(error){if(error.code!=='ENOENT')throw error;}
  if(size&&size+Buffer.byteLength(line)>maxBytes){
   try{unlinkSync(path.join(directory,'studio.2.jsonl'));}catch(error){if(error.code!=='ENOENT')throw error;}
   try{renameSync(path.join(directory,'studio.1.jsonl'),path.join(directory,'studio.2.jsonl'));}catch(error){if(error.code!=='ENOENT')throw error;}
   renameSync(file,path.join(directory,'studio.1.jsonl'));
  }
  appendFileSync(file,line,{mode:0o600});chmodSync(file,0o600);
 }
 return {directory,file,writeSync,write(event){const safe=sanitizeLogEvent(event);const result=queue.then(()=>writeSync(safe));queue=result.catch(()=>{});return result;},flush:()=>queue};
}

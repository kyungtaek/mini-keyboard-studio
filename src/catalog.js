import {getModel} from './models.js';
const fail=()=>{throw Error('키맵 카탈로그 형식이 올바르지 않습니다.');};
const string=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
function object(value,fields){if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).length!==fields.length||fields.some(key=>!Object.hasOwn(value,key)))fail();}
export function validateCatalog(value){
 object(value,['format','version','name','updatedAt','entries']);
 if(value.format!=='mini-keyboard-catalog'||value.version!==1||!string(value.name,128)||!string(value.updatedAt,40)||!Number.isFinite(Date.parse(value.updatedAt))||new Date(value.updatedAt).toISOString()!==value.updatedAt||!Array.isArray(value.entries)||value.entries.length>200)fail();
 const ids=new Set(),paths=new Set();
 for(const entry of value.entries){
  object(entry,['id','name','description','path','sha256','version','modelId','platform','category','tags']);
  if(!string(entry.id,100)||!(/^[a-z0-9][a-z0-9-]*$/).test(entry.id)||ids.has(entry.id)||!string(entry.name,128)||typeof entry.description!=='string'||entry.description.length>1400)fail();
  if(typeof entry.path!=='string'||entry.path.length>240||!(/^keymaps\/[a-z0-9][a-z0-9/_-]*\.json$/).test(entry.path)||entry.path.includes('//')||paths.has(entry.path))fail();
  if(!(/^[a-f0-9]{64}$/).test(entry.sha256)||!(/^\d+\.\d+\.\d+$/).test(entry.version)||!['mac','windows','linux','any'].includes(entry.platform)||!['development','assistant','game','system','other'].includes(entry.category))fail();
  getModel(entry.modelId);
  if(!Array.isArray(entry.tags)||entry.tags.length>8||entry.tags.some(tag=>!string(tag,32)))fail();
  ids.add(entry.id);paths.add(entry.path);
 }
 return structuredClone(value);
}

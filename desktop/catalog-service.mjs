import {mkdir,readFile,writeFile,rename,chmod} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {validateCatalog} from '../src/catalog.js';
import {validateProfile} from '../src/profile.js';
export const REPOSITORY='kyungtaek/mini-keyboard-keymap-catalog';
const BASE=`https://api.github.com/repos/${REPOSITORY}`;
const HASH=/^[a-f0-9]{40}$/;
export async function privateWrite(file,bytes){await mkdir(path.dirname(file),{recursive:true,mode:0o700});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,bytes,{mode:0o600});await chmod(temp,0o600);await rename(temp,file);}
function snapshot(value){if(!value||!HASH.test(value.commit)||typeof value.fetchedAt!=='string'||!Number.isFinite(Date.parse(value.fetchedAt)))throw Error('카탈로그 캐시가 손상되었습니다.');return {manifest:validateCatalog(value.manifest),commit:value.commit,fetchedAt:value.fetchedAt};}
function checkedProfile(bytes,entry){if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('키맵 SHA-256 검증에 실패했습니다. 새로고침 후 다시 시도하세요.');const profile=validateProfile(JSON.parse(bytes.toString('utf8')));if(profile.id!==entry.id||profile.name!==entry.name||profile.modelId!==entry.modelId)throw Error('키맵과 카탈로그 정보가 일치하지 않습니다.');return profile;}
export class CatalogService{
 constructor({cacheDir,getToken,fetcher=fetch}){this.cacheDir=cacheDir;this.getToken=getToken;this.fetcher=fetcher;this.current=null;this.listing=null;}
 async request(resource,max){
  const token=await this.getToken();if(!token)throw Error('GitHub 인증이 필요합니다. gh 로그인 또는 읽기 전용 토큰을 등록하세요.');
  let response;try{response=await this.fetcher(BASE+resource,{headers:{Accept:'application/vnd.github.raw+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10','User-Agent':'Mini-Keyboard-Studio'},redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw Error('GitHub에 연결하지 못했습니다. 네트워크를 확인하세요.');}
  if(!response.ok)throw Error(`GitHub 요청 실패 (${response.status}). 저장소 접근 권한을 확인하세요.`);
  if(Number(response.headers.get('content-length'))>max){await response.body?.cancel();throw Error('카탈로그 응답 크기가 제한을 초과했습니다.');}
  const reader=response.body?.getReader();if(!reader)throw Error('GitHub 응답이 비어 있습니다.');let length=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw Error('카탈로그 응답 크기가 제한을 초과했습니다.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  return Buffer.concat(chunks);
 }
 async loadSnapshot(){try{return snapshot(JSON.parse(await readFile(path.join(this.cacheDir,'snapshot.json'),'utf8')));}catch(error){if(error.code==='ENOENT')return null;throw Error('저장된 카탈로그가 손상되었습니다. 온라인에서 새로고침하세요.');}}
 async list(){if(this.listing)return this.listing;this.listing=this.refresh();try{return await this.listing;}finally{this.listing=null;}}
 async refresh(){
  try{
   const ref=JSON.parse((await this.request('/git/ref/heads/main',128*1024)).toString('utf8'));
   if(!HASH.test(ref.object?.sha)||ref.object?.type!=='commit')throw Error('GitHub 커밋 정보가 올바르지 않습니다.');
   const manifest=validateCatalog(JSON.parse((await this.request('/contents/catalog.json?ref='+ref.object.sha,256*1024)).toString('utf8')));
   const result={manifest,commit:ref.object.sha,fetchedAt:new Date().toISOString()};
   await privateWrite(path.join(this.cacheDir,'snapshot.json'),JSON.stringify(result));this.current=result;return {...result,offline:false};
  }catch(error){const cached=await this.loadSnapshot();if(!cached)throw error;this.current=cached;return {...cached,offline:true,warning:error.message};}
 }
 async download(id){
  if(typeof id!=='string'||id.length>100||!(/^[a-z0-9][a-z0-9-]*$/).test(id))throw Error('잘못된 키맵 ID입니다.');
  const current=this.current||await this.loadSnapshot()||(await this.list());
  const entry=current.manifest.entries.find(item=>item.id===id);if(!entry)throw Error('카탈로그에서 키맵을 찾지 못했습니다. 새로고침하세요.');
  const file=path.join(this.cacheDir,entry.sha256+'.json');let bytes,source='cache';
  try{bytes=await readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;source='github';bytes=await this.request('/contents/'+entry.path+'?ref='+current.commit,128*1024);}
  let profile;
  try{if(bytes.length>128*1024)throw Error('키맵 크기가 제한을 초과했습니다.');profile=checkedProfile(bytes,entry);}catch(error){
   if(source!=='cache')throw error;
   // Repair only from the exact manifest commit; never fall back to another version.
   try{bytes=await this.request('/contents/'+entry.path+'?ref='+current.commit,128*1024);}catch{throw Error('저장된 키맵 SHA-256/형식 검증에 실패했습니다. 온라인에서 다시 다운로드하세요.');}
   profile=checkedProfile(bytes,entry);source='github';
  }
  if(source==='github')await privateWrite(file,bytes);
  return {profile,entry,commit:current.commit,source};
 }
}

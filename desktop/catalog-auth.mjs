import {readFile,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {privateWrite,REPOSITORY} from './catalog-service.mjs';
const execute=promisify(execFile);
function validateToken(token){if(typeof token!=='string'||!(/^[A-Za-z0-9_-]{20,512}$/).test(token))throw Error('GitHub 토큰 형식이 올바르지 않습니다.');return token;}
async function ghToken(){for(const executable of ['/opt/homebrew/bin/gh','/usr/local/bin/gh','/usr/bin/gh']){try{const {stdout}=await execute(executable,['auth','token','--hostname','github.com'],{timeout:5000,maxBuffer:4096,windowsHide:true});return validateToken(stdout.trim());}catch{}}return null;}
export function validateCatalogInvocation(command,args){
 const fields={'list':[],'download':['id'],'auth-status':[],'save-token':['token'],'clear-token':[]};
 if(!Object.hasOwn(fields,command)||!args||Array.isArray(args)||typeof args!=='object'||Object.keys(args).length!==fields[command].length||fields[command].some(key=>!Object.hasOwn(args,key)))throw Error('지원하지 않는 카탈로그 요청입니다.');
 if(command==='download'&&(typeof args.id!=='string'||args.id.length>100||!(/^[a-z0-9][a-z0-9-]*$/).test(args.id)))throw Error('잘못된 키맵 ID입니다.');
 if(command==='save-token')validateToken(args.token);
}
export class CatalogAuth{
 constructor({dataDir,safeStorage,ghToken:lookup=ghToken}){this.file=path.join(dataDir,'catalog-credential.bin');this.safeStorage=safeStorage;this.lookup=lookup;this.mutation=Promise.resolve();}
 async encryptedAvailable(){if(!await this.safeStorage.isAsyncEncryptionAvailable())throw Error('시스템 암호화를 사용할 수 없어 토큰을 저장하거나 읽을 수 없습니다.');}
 async credentials(){
  let bytes;try{bytes=await readFile(this.file);}catch(error){if(error.code!=='ENOENT')throw Error('저장된 GitHub 인증을 읽지 못했습니다.');}
  if(bytes){await this.encryptedAvailable();try{const decrypted=await this.safeStorage.decryptStringAsync(bytes);return {token:validateToken(decrypted.result),method:'stored'};}catch{throw Error('저장된 GitHub 인증을 복호화하지 못했습니다. 토큰을 다시 등록하세요.');}}
  const token=await this.lookup();return {token:token||null,method:token?'gh':'none'};
 }
 async getToken(){return (await this.credentials()).token;}
 async status(){const {token,method}=await this.credentials();return {connected:Boolean(token),method,repository:REPOSITORY};}
 async save(token){validateToken(token);await this.encryptedAvailable();const encrypted=await this.safeStorage.encryptStringAsync(token);await privateWrite(this.file,encrypted);return {connected:true,method:'stored',repository:REPOSITORY};}
 async clear(){try{await unlink(this.file);}catch(error){if(error.code!=='ENOENT')throw error;}return this.status();}
}

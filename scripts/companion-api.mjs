import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import path from 'node:path';

export function authorizeApi(req,port,token){
 const host=req.headers.host;
 if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(host))throw Error('허용되지 않은 Host');
 if(req.headers.origin&&req.headers.origin!==`http://${host}`)throw Error('허용되지 않은 Origin');
 if(req.method!=='GET'){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Error('JSON 요청만 허용합니다.');
  const expected=Buffer.from(token),actual=Buffer.from(String(req.headers['x-mini-session']||''));
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('보조 앱 세션 토큰이 일치하지 않습니다.');
 }
}
export const commands=new Set(['list','open','close','exchange','begin','end','abort','recover','configure','state','readLighting','setLighting','restoreLighting','status']);
export class CompanionGateway{
 constructor(root,options={}){this.root=root;this.cwd=options.cwd||root;this.token=randomUUID();this.child=null;this.closing=false;this.shutdownTimeoutMs=options.shutdownTimeoutMs??35000;this.pending=new Map();this.python=options.executable||path.join(root,'.venv','bin','python');this.args=options.args||[path.join(root,'companion','bridge.py')];this.backupDir=options.backupDir;this.stderr='';}
 get available(){return existsSync(this.python)&&(!this.args.length||existsSync(this.args[0]));}
 start(){
  if(this.child){if(this.closing||this.child.stdin.writableEnded||this.child.stdin.destroyed)throw Error('보조 프로세스가 복구·종료 중입니다. 잠시 후 다시 연결하세요.');return;}
  if(!this.available)throw Error('보조 앱 런타임이 없습니다. companion/requirements.txt로 로컬 환경을 준비하세요.');
  const child=spawn(this.python,this.args,{cwd:this.cwd,env:{...process.env,...(this.backupDir?{MINI_KEYBOARD_BACKUP_DIR:this.backupDir}:{})},stdio:['pipe','pipe','pipe']});this.child=child;this.closing=false;this.stderr='';
  const lines=createInterface({input:child.stdout});
  lines.on('line',line=>{
   let message;try{message=JSON.parse(line);}catch{return;}
   const pending=this.pending.get(message.id);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(message.id);
   message.ok?pending.resolve(message.result):pending.reject(Error(message.error||'보조 앱 명령 실패'));
  });
  child.stderr.on('data',data=>{this.stderr=(this.stderr+String(data)).slice(-4000);process.stderr.write(String(data).slice(0,2000));});
  child.stdin.on('error',error=>{if(this.child!==child)return;this.closing=true;for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(error);}this.pending.clear();});
  const fail=error=>{if(this.child!==child)return;this.child=null;this.closing=false;for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(error);}this.pending.clear();};
  child.on('error',fail);child.on('exit',()=>{lines.close();fail(Error('보조 앱 프로세스가 종료되었습니다. 다시 연결하세요.'));});
 }
 async call(command,args={}){
  if(!commands.has(command))return Promise.reject(Error('지원하지 않는 보조 앱 명령입니다.'));
  this.start();const id=randomUUID();
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('보조 앱 응답 시간 초과'));},30000);
   this.pending.set(id,{resolve,reject,timer});this.child.stdin.write(JSON.stringify({...args,id,command})+'\n',error=>{if(error){clearTimeout(timer);this.pending.delete(id);reject(error);}});
  });
 }
 async handle(req,res,port){
  const json=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  try{authorizeApi(req,port,this.token);}catch(error){json(403,{error:error.message});return;}
  if(req.method==='GET'){json(200,{available:this.available,token:this.token,running:Boolean(this.child)});return;}
  if(req.method!=='POST'){json(405,{error:'POST만 지원합니다.'});return;}
  try{
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>128*1024)throw Error('요청 크기 초과');chunks.push(chunk);}
   const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON 객체가 필요합니다.');
   const {command,...args}=value;const result=await this.call(command,args);json(200,{result});
  }catch(error){json(422,{error:error.message});}
 }
 async stop(){
  const child=this.child;if(!child)return;this.closing=true;
  const exited=new Promise((resolve,reject)=>{
   const cleanup=()=>{clearTimeout(timer);child.removeListener('exit',onExit);child.removeListener('error',onError);};
   const onExit=(code,signal)=>{cleanup();code===0?resolve():reject(Error(`보조 프로세스 종료 확인 실패 (${signal||code}): ${this.stderr}`));};
   const onError=error=>{cleanup();reject(error);};
   const timer=setTimeout(()=>{cleanup();reject(Error('보조 프로세스의 복구·종료가 지연되고 있습니다.'));},this.shutdownTimeoutMs);
   child.once('exit',onExit);child.once('error',onError);
  });
  // EOF lets the HID owner abort an active lease and verify restoration itself.
  if(!child.stdin.writableEnded)child.stdin.end();await exited;
 }
}

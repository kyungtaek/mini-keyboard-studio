import {MiniKeyboard} from './device.js';
let sessionToken=null;
export async function companionCall(command,args={}){
 if(globalThis.miniKeyboardDesktop?.version===1)return globalThis.miniKeyboardDesktop.call(command,args);
 if(!sessionToken){
  const response=await fetch('/api/companion',{cache:'no-store'});const value=await response.json();
  if(!response.ok||!value.available)throw Error('보조 앱 런타임을 먼저 준비하세요.');sessionToken=value.token;
 }
 const response=await fetch('/api/companion',{method:'POST',headers:{'Content-Type':'application/json','X-Mini-Session':sessionToken},body:JSON.stringify({...args,command})});
 const value=await response.json();if(!response.ok){if(response.status===403)sessionToken=null;throw Error(value.error||'보조 앱 요청 실패');}return value.result;
}
class CompanionHID extends EventTarget{
 constructor(info){super();Object.assign(this,info);this.opened=true;this.lease=null;}
 async beginTransaction(){if(this.lease)throw Error('이전 트랜잭션 종료를 확인해야 합니다. 다시 연결해 복구하세요.');this.lease=crypto.randomUUID();await companionCall('begin',{lease:this.lease});}
 async endTransaction(){const lease=this.lease;if(lease){const result=await companionCall('end',{lease});this.lease=null;if(result?.aborted)throw Error('장치 설정 작업이 중단되어 원본으로 복구됐습니다. 적용 상태를 다시 읽어 확인하세요.');}}
 async abortTransaction(){const lease=this.lease;if(lease){await companionCall('abort',{lease});this.lease=null;}}
 async sendReport(reportId,data){
  const result=await companionCall('exchange',{reportId,data:[...data],...(this.lease?{lease:this.lease}:{})});
  for(const report of result.reports||[]){const event=new Event('inputreport');event.reportId=report.reportId;event.data=new DataView(Uint8Array.from(report.data).buffer);this.dispatchEvent(event);}
 }
 async close(){try{await this.abortTransaction();const result=await companionCall('close');if(result?.restorationError)throw Error(result.restorationError);}finally{this.opened=false;}}
}
export async function connectCompanionDevice(){
 const status=await companionCall('status');
 if(status.leaseActive){
  if(status.recoveryAvailable)await companionCall('recover');
  else throw Error(`다른 탭에서 장치 설정 중입니다. 작업이 중단됐다면 ${Math.max(1,Math.ceil((status.leaseExpiresInMs||120000)/1000))}초 후 다시 연결해 원본을 복구하세요.`);
 }
 const info=await companionCall('open');const device=new CompanionHID(info);const controller=new MiniKeyboard(device);controller.transport='companion';
 try{return await controller.initialize();}catch(error){await device.close();throw error;}
}

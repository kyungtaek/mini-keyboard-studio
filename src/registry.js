import {MODELS} from './models.js';
// USB candidates recovered from MINI_KEYBOARD's PID_GRU, not a claim that
// these VID/PID pairs all share the same record codec.
export const VENDORS=[0x1189,0x514c];
export const PRODUCTS=[0x8830,0x8831,0x8832,0x8833,0x8840,0x8842,0x8850,0x8851];
export function isMiniKeyboard(vid,pid){return VENDORS.includes(vid)&&PRODUCTS.includes(pid);}
export function deviceFilters(){return VENDORS.flatMap(vendorId=>PRODUCTS.map(productId=>({vendorId,productId,usagePage:0xff00,usage:1})));}
export function matchFirmware(vid,pid,identity){
 const unsupported=reason=>({modelId:null,protocol:null,writable:false,verified:false,reason});
 if(!isMiniKeyboard(vid,pid)||!Array.isArray(identity)||identity.length!==3)return unsupported('지원하는 Mini Keyboard 설정 인터페이스가 아닙니다.');
 const [keys,encoders,variant]=identity;
 if(!identity.every(x=>Number.isInteger(x)&&x>=0&&x<=255))return unsupported('잘못된 모델 응답입니다.');
 // This exact public-reference tuple is an exception, not a general rule that
 // the key count is a zero-based maximum. Never send model selection commands.
 const reference=vid===0x514c&&pid===0x8850&&keys===15&&encoders===3&&variant===0;
 const model=MODELS.find(m=>m.keys===(reference?16:keys)&&m.encoders===encoders);
 if(variant<10&&!reference)return unsupported('이 기기는 구형 설정 프로토콜입니다. 입력 형식이 다른 변종이 있어 기록을 잠갔습니다.');
 if(!model)return unsupported('인식된 키·다이얼 수에 대응하는 레이아웃이 아직 없습니다.');
 return {modelId:model.id,protocol:'fd65',writable:true,verified:vid===0x514c&&pid===0x8850&&keys===16&&encoders===3&&variant===11,
  reason:'모델 응답과 전체 설정을 읽어 FD65 레코드를 검증한 뒤 기록합니다.'};
}

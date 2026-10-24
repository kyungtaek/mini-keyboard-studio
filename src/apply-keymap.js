import {validateProfile} from './profile.js';
import {resolveLighting} from './lighting-profile.js';
function expectedDevice(device,status){
 const target=device.hidDevice,actual=status.device;
 if(!target?.pathHex||actual?.pathHex!==target.pathHex||!target.serialNumber||actual.serialNumber!==target.serialNumber||actual.vendorId!==target.vendorId||actual.productId!==target.productId||!Array.isArray(actual.identity)||!Array.isArray(device.identity)||actual.identity.length!==3||actual.identity.some((value,index)=>value!==device.identity[index]))throw Error('키보드 연결이 변경되었습니다. 다시 연결한 뒤 적용하세요.');
 return {vendorId:actual.vendorId,productId:actual.productId,identity:[...actual.identity],serialNumber:actual.serialNumber};
}
export async function applyKeymap(device,value,{companionCall,persistBackup,onProgress=()=>{}}={}){
 const profile=validateProfile(value);
 const requested=profile.layers.some(layer=>layer.lighting&&(layer.lighting.mode!==null||layer.lighting.colors.some(color=>color!==null)));
 if(!requested)return device.apply(profile,{persistBackup,onProgress});
 if(device.transport!=='companion'||typeof companionCall!=='function')throw Error('키맵의 LED 설정은 데스크톱 앱 장치 연결이 필요합니다.');
 const status=await companionCall('status');
 if(!status.connected||!status.capabilities?.lightingRead||!status.capabilities?.lightingWrite||status.leaseActive||status.lightingRecoveryRequired)throw Error('장치 LED 설정을 사용할 수 없습니다. 연결·복구 상태를 확인하세요.');
 const binding=expectedDevice(device,status);
 const current=await companionCall('readLighting');
 if(!Array.isArray(current.layers)||current.layers.length!==3)throw Error('현재 LED 설정을 확인할 수 없습니다.');
 const layers=profile.layers.flatMap((layer,index)=>{
  if(!layer.lighting||(layer.lighting.mode===null&&layer.lighting.colors.every(color=>color===null)))return [];
  const desired=resolveLighting(layer.lighting,current.layers[index],profile.modelId);
  if(desired.mode>5)throw Error('LED 모드를 0~5 중에서 선택하세요.');
  return [{layer:index,...desired}];
 });
 expectedDevice(device,await companionCall('status'));
 const keys=await device.apply(profile,{persistBackup,onProgress});
 if(!layers.length)return {...keys,lightingChanged:0};
 try{
  onProgress('LED 색상·모드 저장 및 재읽기 확인 중…');
  const result=await companionCall('saveProfileLighting',{layers,expectedDevice:binding});
  if(result.verified!==true)throw Error('LED 재읽기 검증 결과를 받지 못했습니다.');
  return {...keys,lightingChanged:layers.length};
 }catch(error){
  if(keys.changed&&keys.backup){
   try{expectedDevice(device,await companionCall('status'));await device.restore(keys.backup,{persistBackup,onProgress});}
   catch(restoreError){throw Error(`LED 적용 실패. 키 설정 복원도 확인하지 못했습니다: ${restoreError.message}`);}
  }
  throw Error(`LED 적용 실패: ${error.message}. 키 설정은 원본으로 복원했습니다. LED 복구 상태도 확인하세요.`);
 }
}

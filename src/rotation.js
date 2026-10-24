import {validateProfile} from './profile.js';
import {getModel,gridActionIds} from './models.js';
// Keep the visible key layout when the physical device is turned. Knobs retain IDs.
export function rotateProfileKeys(value,rotation,{currentActions}={}){
 const profile=validateProfile(value),model=getModel(profile.modelId);
 const before=gridActionIds(model,profile.rotation),after=gridActionIds(model,rotation);
 if(!before||!after||before.length!==after.length||before[0].length!==after[0].length)throw Error('이 모델은 해당 각도의 키 재배치를 지원하지 않습니다. 화면 방향만 변경할 수 있습니다.');
 const source=before.flat(),destination=after.flat();
 for(let l=0;l<profile.layers.length;l++){
  const actions=profile.layers[l].actions.map(action=>structuredClone(action));
  const colors=profile.layers[l].lighting?.colors.slice();
  source.forEach((id,index)=>{
   let action=actions[id-1];
   if(action.type==='preserve')action=currentActions?.[l]?.[id-1];
   if(!action||action.type==='preserve')throw Error(`레이어 ${l+1} 키 ${id}의 동작을 알 수 없습니다. 키 설정을 지정한 뒤 다시 시도하세요.`);
   profile.layers[l].actions[destination[index]-1]=structuredClone(action);
   if(colors)profile.layers[l].lighting.colors[destination[index]-1]=colors[id-1];
  });
 }
 profile.rotation=rotation;return validateProfile(profile);
}

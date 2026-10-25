import {validateProfile} from './profile.js';
import {getModel} from './models.js';

export function swapProfileKeys(value,layer,from,to,currentActions=[]){
 const profile=validateProfile(value),count=getModel(profile.modelId).keys;
 if(!Number.isInteger(layer)||layer<0||layer>=profile.layers.length||![from,to].every(id=>Number.isInteger(id)&&id>=1&&id<=count))throw Error('교환할 키 위치가 올바르지 않습니다.');
 if(from===to)return profile;
 const actions=profile.layers[layer].actions;
 const resolve=id=>{
  const action=actions[id-1];
  if(action.type!=='preserve')return action;
  const current=currentActions[id-1];
  if(!current||current.type==='preserve')throw Error('현재 키 값을 먼저 장치에서 읽은 뒤 교환하세요.');
  return structuredClone(current);
 };
 const first=resolve(from),second=resolve(to);
 [actions[from-1],actions[to-1]]=[second,first];
 const colors=profile.layers[layer].lighting?.colors;
 if(colors)[colors[from-1],colors[to-1]]=[colors[to-1],colors[from-1]];
 return validateProfile(profile);
}

export function installKeySwapDrag({root,context,onSwap,onError=()=>{}}){
 let drag=null;
 const key=target=>target?.closest?.('.keycap[data-key]');
 const clear=()=>{root.querySelectorAll('.key-dragging,.key-drop-target').forEach(el=>el.classList.remove('key-dragging','key-drop-target'));drag=null;};
 const valid=()=>{const c=context();return drag&&!c.busy&&!c.recording&&c.profile===drag.profile&&c.layer===drag.layer&&c.profile.rotation===drag.rotation;};
 root.addEventListener('dragstart',event=>{
  const el=key(event.target),c=context();
  if(!el)return;
  if(c.busy||c.recording){event.preventDefault();return;}
  drag={from:Number(el.dataset.key),profile:c.profile,layer:c.layer,rotation:c.profile.rotation};
  event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-mini-key-swap',String(drag.from));
  el.classList.add('key-dragging');
 });
 root.addEventListener('dragover',event=>{
  if(!valid())return;const el=key(event.target);if(!el||Number(el.dataset.key)===drag.from)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';
  root.querySelectorAll('.key-drop-target').forEach(other=>{if(other!==el)other.classList.remove('key-drop-target');});el.classList.add('key-drop-target');
 });
 root.addEventListener('dragleave',event=>{const el=key(event.target);if(el&&!el.contains(event.relatedTarget))el.classList.remove('key-drop-target');});
 root.addEventListener('drop',event=>{
  const el=key(event.target);if(!valid()||!el){clear();return;}
  event.preventDefault();const from=drag.from,to=Number(el.dataset.key);clear();if(from===to)return;
  try{onSwap(from,to);}catch(error){onError(error);}
 });
 root.addEventListener('dragend',clear);
}

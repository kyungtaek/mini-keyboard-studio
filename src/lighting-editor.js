// Direct LED editing shares the companion's original backup and readback gates.
const colorPattern=/^#[0-9a-f]{6}$/i;
function colors(value){
 if(!Array.isArray(value)||value.length!==16||value.some(color=>typeof color!=='string'||!colorPattern.test(color)))throw Error('색상 16개를 #rrggbb 형식으로 선택하세요.');
 return value.map(color=>color.toLowerCase());
}
function desiredLighting(value){
 if(!Number.isInteger(value?.layer)||value.layer<0||value.layer>2)throw Error('레이어 1~3 중에서 선택하세요.');
 if(!Number.isInteger(value.mode)||value.mode<0||value.mode>5)throw Error('지원 범위의 모드 0~5를 선택하세요.');
 return {layer:value.layer,mode:value.mode,colors:colors(value.colors)};
}
export function createLightingController({companionCall,getDevice,getBusy=()=>false}){
 async function status(write=false){
  const target=getDevice();
  if(!target||target.transport!=='companion'||target.hidDevice?.opened===false)throw Error('보조앱으로 키보드를 연결하세요.');
  if(getBusy())throw Error('진행 중인 장치 작업이 끝난 뒤 설정하세요.');
  const value=await companionCall('status');
  if(getBusy())throw Error('진행 중인 장치 작업이 끝난 뒤 설정하세요.');
  if(getDevice()!==target||!value.connected||(target.hidDevice?.pathHex&&target.hidDevice.pathHex!==value.device?.pathHex))throw Error('키보드 연결이 변경되었습니다. 다시 연결하세요.');
  if(value.leaseActive)throw Error('키 설정 작업이 끝난 뒤 LED를 설정하세요.');
  if(!value.capabilities?.lightingRead)throw Error('연결한 키보드의 LED 읽기를 지원하지 않습니다.');
  if(write&&value.lightingRecoveryRequired)throw Error('원래 LED 복원을 먼저 실행한 뒤 다시 설정하세요.');
  if(write&&!value.capabilities?.lightingWrite)throw Error('연결한 키보드의 LED 설정을 지원하지 않습니다.');
  return value;
 }
 return {
  status,
  async read(){
   await status();
   const result=await companionCall('readLighting');
   if(!Array.isArray(result?.layers)||result.layers.length!==3)throw Error('장치 LED 읽기 결과가 올바르지 않습니다.');
   return result.layers.map(value=>{
    if(!Number.isInteger(value.mode)||value.mode<0||value.mode>255)throw Error('장치 LED 모드 응답이 올바르지 않습니다.');
    return {mode:value.mode,colors:colors(value.colors)};
   });
  },
  async apply(value){
   const desired=desiredLighting(value);
   await status(true);
   const result=await companionCall('setLighting',desired);
   if(result?.verified!==true)throw Error('LED 적용 후 장치 재읽기 확인을 받지 못했습니다. 원래 LED 복원으로 확인하세요.');
   return result;
  }
 };
}

export function initLightingEditor({container,companionCall,getDevice,getBusy=()=>false,runExclusive=work=>work(),onApplied=()=>{}}){
 if(!container)throw Error('LED 설정을 표시할 영역이 없습니다.');
 let ownsWork=false;
 const controller=createLightingController({companionCall,getDevice,getBusy:()=>getBusy()&&!ownsWork});
 container.classList.add('direct-lighting');
 container.innerHTML=`<div class="direct-lighting-heading"><h3>LED 직접 설정</h3><span class="small-text muted">앱 종료 시 원래 LED로 복원</span></div>
  <form class="direct-lighting-form">
   <div class="direct-lighting-controls"><label class="field"><span class="field-label">레이어</span><select data-direct-layer aria-label="직접 설정할 LED 레이어"><option value="0">레이어 1</option><option value="1">레이어 2</option><option value="2">레이어 3</option></select></label>
   <label class="field"><span class="field-label">모드</span><select data-direct-mode aria-label="LED 모드">${Array.from({length:6},(_,mode)=>`<option value="${mode}">모드 ${mode}</option>`).join('')}</select></label>
   <label class="field"><span class="field-label">색상</span><select data-direct-color-mode aria-label="LED 색상 설정 방식"><option value="uniform">전체 같은 색</option><option value="individual">슬롯별 색</option></select></label></div>
   <p class="direct-lighting-note small-text muted">모드별 실제 효과와 색상 슬롯의 물리 위치는 확인되지 않았습니다.</p>
   <label class="direct-uniform" data-direct-uniform><span>전체 색상</span><input type="color" data-direct-color value="#539df5" aria-label="전체 LED 색상"></label>
   <fieldset class="direct-color-slots" data-direct-slots hidden><legend class="sr-only">색상 슬롯 16개</legend>${Array.from({length:16},(_,index)=>`<label><span>${index+1}</span><input type="color" value="#539df5" data-direct-slot="${index}" aria-label="LED 색상 슬롯 ${index+1}"></label>`).join('')}</fieldset>
   <div class="direct-lighting-actions"><button type="button" class="quiet" data-direct-read>현재 LED 불러오기</button><button type="submit" class="primary" data-direct-apply disabled>LED 적용</button></div>
   <p class="direct-lighting-message small-text" data-direct-message role="status" aria-live="polite">장치 LED를 불러온 뒤 설정하세요.</p>
  </form>`;
 const $=selector=>container.querySelector(selector), form=$('form'), layer=$('[data-direct-layer]'), mode=$('[data-direct-mode]'), colorMode=$('[data-direct-color-mode]'), color=$('[data-direct-color]');
 const slots=[...container.querySelectorAll('[data-direct-slot]')];
 let loading=false,loaded=false,supported=false,readable=false,cached=null;
 function message(text,error=false){const node=$('[data-direct-message]');node.textContent=text;node.classList.toggle('error-text',error);}
 function render(){
  const individual=colorMode.value==='individual';
  $('[data-direct-uniform]').hidden=individual;
  $('[data-direct-slots]').hidden=!individual;
  for(const control of form.elements)control.disabled=loading;
  $('[data-direct-apply]').disabled=loading||!loaded||!supported||Number(mode.value)>5;
  $('[data-direct-read]').disabled=loading||!readable;
 }
 function loadSelected(){
  if(!cached)return;
  const selected=cached[Number(layer.value)];
  mode.querySelector('[data-unknown-mode]')?.remove();
  if(selected.mode>5){const option=document.createElement('option');option.value=String(selected.mode);option.textContent=`장치 모드 ${selected.mode} (읽기값)`;option.disabled=true;option.dataset.unknownMode='';mode.append(option);}
  mode.value=String(selected.mode);
  selected.colors.forEach((value,index)=>{slots[index].value=value;});
  color.value=selected.colors[0];
  colorMode.value=selected.colors.every(value=>value===selected.colors[0])?'uniform':'individual';
  loaded=true;render();
 }
 async function work(operation){
  if(loading)return;
  if(getBusy()){message('진행 중인 장치 작업이 끝난 뒤 설정하세요.',true);return;}
  loading=true;render();
  try{await runExclusive(async()=>{ownsWork=true;try{await operation();}finally{ownsWork=false;}});}catch(error){message(error.message||String(error),true);}
  finally{loading=false;render();}
 }
 async function refresh({read=true}={}){
  return work(async()=>{
   loaded=false;supported=false;readable=false;
   const status=await controller.status();
   supported=Boolean(status.capabilities.lightingWrite&&!status.lightingRecoveryRequired);
   readable=Boolean(status.capabilities.lightingRead);
   if(status.lightingRecoveryRequired){message('원래 LED 복원을 먼저 실행하세요.',true);return;}
   if(read){cached=await controller.read();loadSelected();message('현재 장치 LED를 불러왔습니다.');}
   else message('현재 LED를 불러온 뒤 설정하세요.');
  });
 }
 $('[data-direct-read]').addEventListener('click',()=>refresh());
 layer.addEventListener('change',loadSelected);
 mode.addEventListener('change',render);
 colorMode.addEventListener('change',render);
 color.addEventListener('input',()=>{for(const slot of slots)slot.value=color.value;});
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!loaded||!supported)return;
  work(async()=>{
   const desired={layer:Number(layer.value),mode:Number(mode.value),colors:colorMode.value==='uniform'?Array(16).fill(color.value):slots.map(slot=>slot.value)};
   message('원본 LED 백업 후 적용·재읽기 확인 중…');
   const result=await controller.apply(desired);
   if(cached)cached[desired.layer]={mode:desired.mode,colors:desired.colors};
   message(result.changed?'LED 적용과 재읽기 확인을 마쳤습니다.':'장치 LED가 이미 같은 설정입니다.');
   await onApplied(result);
  });
 });
 render();
 return {refresh};
}

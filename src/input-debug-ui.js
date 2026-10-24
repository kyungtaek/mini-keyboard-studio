import {eventChord,matchInput,appendObservation} from './input-debug.js';
import {gridActionIds,getModel} from './models.js';
import {actionLabel} from './profile.js';
export function initInputDebug({getContext,readSnapshot,download}){
 const desktop=globalThis.miniKeyboardDesktop,escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dialog=document.createElement('dialog');dialog.className='input-debug-dialog';dialog.id='input-debug-dialog';
 dialog.setAttribute('aria-labelledby','input-debug-title');
 dialog.innerHTML=`<div class="dialog-heading"><div><h2 id="input-debug-title">키 입력 진단</h2><p class="debug-caption">화면의 키를 선택한 뒤 실제 키보드에서 눌러 보세요.</p></div><button id="debug-close" aria-label="진단 닫기">×</button></div><div class="debug-toolbar"><span id="debug-status" role="status">일시 정지</span><button id="debug-toggle" class="primary">측정 시작</button><label class="debug-layer">레이어 <select id="debug-layer" aria-label="진단 레이어"><option value="1">레이어 1</option><option value="2">레이어 2</option><option value="3">레이어 3</option></select></label><button id="debug-refresh">설정 다시 읽기</button></div><div class="debug-content"><div><div id="debug-grid" class="debug-grid"></div><p id="debug-expected" class="debug-caption"></p></div><div class="debug-observation"><span class="debug-caption">실제 입력</span><strong id="debug-chord">키를 눌러 주세요</strong><code id="debug-raw"></code><p id="debug-match" role="status"></p><p class="debug-caption">파란색: 선택 레이어에서 일치하는 후보<br>선택 레이어의 설정만 비교합니다. 실제 장치 레이어는 키보드에서 전환합니다.</p></div></div><div id="debug-history" class="debug-history" aria-label="입력 기록"></div><div class="debug-bottom"><span id="debug-count">0 / 200 이벤트</span><button id="debug-clear">기록 지우기</button><button id="debug-export">측정 파일 저장</button></div><p class="debug-caption">측정 중 이 앱의 입력 동작을 차단합니다. 다른 앱으로 이동하면 정지합니다. OS 예약 키·미디어 키는 감지되지 않을 수 있습니다. 일반 키보드 입력도 포함되며, 물리 장치 구분은 할 수 없습니다.</p>`;
 document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id);
 let active=false,session=null,expectedId=1,observations=[],matches=[],generation=0,lastChord=null;
 const clearHighlights=()=>document.querySelectorAll('.debug-hit').forEach(node=>node.classList.remove('debug-hit'));
 function render(){
  if(!session)return;
  const model=getModel(session.modelId),grid=gridActionIds(model,session.rotation)||Array.from({length:model.rows},(_,row)=>Array.from({length:model.columns},(_,col)=>row*model.columns+col+1).filter(id=>id<=model.keys));
  $('debug-layer').value=String(session.layer);
  $('debug-grid').style.gridTemplateColumns=`repeat(${grid[0].length},minmax(0,1fr))`;
  $('debug-grid').innerHTML=grid.flat().map(id=>`<button data-debug-id="${id}" class="${id===expectedId?'debug-selected ':''}${matches.some(item=>item.layer===session.layer&&item.id===id)?'debug-hit':''}"><small>${String(id).padStart(2,'0')}</small><span>${escape(actionLabel(session.profileActions[session.layer-1]?.[id-1]||{type:'preserve'}))}</span></button>`).join('');
  $('debug-expected').textContent=`확인할 위치: 레이어 ${session.layer} · 키 ${expectedId} · ${actionLabel(session.profileActions[session.layer-1]?.[expectedId-1]||{type:'preserve'})}`;
  $('debug-status').textContent=active?'● 입력 측정 중':'일시 정지';$('debug-toggle').textContent=active?'측정 정지':'측정 시작';
  $('debug-count').textContent=`${observations.length} / 200 이벤트`;
 }
 async function setActive(enabled){
  const token=++generation;
  if(!enabled){active=false;render();await desktop?.setInputDebug?.(false);return;}
  const result=desktop?.setInputDebug?await desktop.setInputDebug(true):document.hasFocus();
  if(token!==generation||!dialog.open)return;
  active=result===true;render();
 }
 function pause(){generation++;active=false;render();}
 function renderHistory(){
  $('debug-history').textContent=observations.filter(item=>item.expected.layer===session.layer).slice(-12).reverse().map(item=>`${new Date(item.event.timestamp).toLocaleTimeString()}  ${item.event.type}  ${item.event.code}  ${item.chord?.join('+')||''}  → ${item.matches?.map(m=>`L${m.layer}/K${m.id}`).join(', ')||'—'}`).join('\n');
 }
 function renderMatch(){
  $('debug-match').textContent=matches.length?matches.map(item=>`장치 L${item.layer} · 키 ${item.id}`).join(' / '):session.deviceActions?`레이어 ${session.layer}에서 일치하는 단일 키 설정 없음`:'장치 설정을 읽으면 위치를 비교할 수 있습니다.';
 }
 function receive(event){
  if(!dialog.open||!active)return;
  const chord=eventChord(event);
  appendObservation(observations,event,{id:expectedId,layer:session.layer,action:session.profileActions[session.layer-1]?.[expectedId-1]});
  if(chord){
   lastChord=chord;
   matches=matchInput(chord,session.deviceActions,session.layer);
   const last=observations.at(-1);last.chord=chord;last.matches=matches;
   $('debug-chord').textContent=chord.join(' + ');
   renderMatch();
   clearHighlights();
   // These are configuration matches, not a claim of a hardware scan code.
   for(const item of matches){if(item.layer===session.layer&&item.layer===getContext().layer+1){const node=document.querySelector(`#key-grid [data-key="${item.id}"]`);node?.classList.add('debug-hit');}}
  }
  $('debug-raw').textContent=`${event.type} · ${event.code||'unknown'}${event.isAutoRepeat?' · 반복':''}`;
  renderHistory();
  render();
 }
 desktop?.onDebugInput?.(receive);desktop?.onDebugPaused?.(pause);
 window.addEventListener('blur',()=>{if(active){pause();desktop?.setInputDebug?.(false);}});
 document.addEventListener('keydown',fallback,true);document.addEventListener('keyup',fallback,true);
 function fallback(event){if(desktop?.setInputDebug||!active||!dialog.open)return;event.preventDefault();event.stopImmediatePropagation();receive({type:event.type,key:event.key,code:event.code,control:event.ctrlKey,shift:event.shiftKey,alt:event.altKey,meta:event.metaKey,isAutoRepeat:event.repeat,isComposing:event.isComposing,location:event.location,timestamp:Date.now()});}
 async function refresh(){
  await setActive(false);matches=[];clearHighlights();render();$('debug-status').textContent='장치 설정 읽는 중…';$('debug-refresh').disabled=true;
  try{const result=await readSnapshot();if(result&&result.modelId!==session.modelId)throw Error('모델 불일치');session.deviceActions=result?.actions?structuredClone(result.actions):null;session.snapshotAt=result?new Date().toISOString():null;$('debug-match').textContent=result?'장치의 세 레이어를 읽었습니다.':'장치 연결 후 다시 읽어 주세요.';}
  catch(error){$('debug-match').textContent=error.message==='모델 불일치'?'편집 모델과 연결한 장치 모델이 다릅니다. 모델을 맞춘 뒤 진단을 다시 여세요.':'설정을 읽지 못했습니다. 연결을 확인하세요.';session.deviceActions=null;session.snapshotAt=null;}
  finally{$('debug-refresh').disabled=false;render();}
 }
 dialog.addEventListener('close',()=>{setActive(false);clearHighlights();});
 $('debug-close').onclick=()=>dialog.close();$('debug-toggle').onclick=()=>setActive(!active);
 $('debug-refresh').onclick=refresh;
 $('debug-layer').onchange=()=>{session.layer=Number($('debug-layer').value);matches=matchInput(lastChord,session.deviceActions,session.layer);clearHighlights();renderMatch();renderHistory();render();};
 $('debug-grid').onclick=event=>{const node=event.target.closest('[data-debug-id]');if(node){expectedId=Number(node.dataset.debugId);render();}};
 $('debug-clear').onclick=()=>{observations=[];matches=[];lastChord=null;clearHighlights();$('debug-history').textContent='';$('debug-chord').textContent='키를 눌러 주세요';$('debug-raw').textContent='';$('debug-match').textContent='';render();};
 $('debug-export').onclick=async()=>{await setActive(false);download({format:'mini-keyboard-input-debug',version:1,createdAt:new Date().toISOString(),session,observations,limitations:['Input events cannot identify which physical keyboard sent them.','Matches are configuration candidates within the selected diagnostic layer, not physical scan codes.','OS shortcuts and media events may be unavailable.']},`keyboard-input-debug-${Date.now()}.json`);};
 return {async open(){
  await setActive(false);const context=getContext();session={modelId:context.profile.modelId,rotation:context.profile.rotation,layer:context.layer+1,profileActions:structuredClone(context.profile.layers.map(item=>item.actions)),deviceActions:null,snapshotAt:null};
  expectedId=context.selected;observations=[];matches=[];lastChord=null;clearHighlights();$('debug-history').textContent='';$('debug-chord').textContent='키를 눌러 주세요';$('debug-raw').textContent='';$('debug-match').textContent='';
  dialog.showModal();render();await refresh();
 }};
}

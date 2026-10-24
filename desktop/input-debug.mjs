// App-window-only capture. Key events are sent to the renderer and never persisted.
export function createInputDebug({isFocused,send,now=Date.now}){
 let armed=false;
 function pause(reason){if(!armed)return;armed=false;send('mini:debug-paused',{reason});}
 return {
  set(value){
   if(typeof value!=='boolean')throw Error('입력 진단 설정은 boolean이어야 합니다.');
   if(!value){pause('disabled');return false;}
   if(!isFocused()){pause('focus-lost');return false;}
   armed=true;return true;
  },
  pause,
  handle(event,input){
   if(!armed)return;
   if(!isFocused()){pause('focus-lost');return;}
   // Electron also suppresses native menu accelerators when this is prevented.
   event.preventDefault();
   if(!input||!['keyDown','keyUp'].includes(input.type))return;
   const bounded=value=>typeof value==='string'?value.slice(0,64):'';
   send('mini:debug-input',{
    type:input.type,key:bounded(input.key),code:bounded(input.code),
    control:input.control===true,shift:input.shift===true,alt:input.alt===true,meta:input.meta===true,
    isAutoRepeat:input.isAutoRepeat===true,isComposing:input.isComposing===true,
    location:[0,1,2,3].includes(input.location)?input.location:0,timestamp:now()
   });
  }
 };
}

const codes={Enter:'ENTER',Escape:'ESC',Backspace:'BACKSPACE',Tab:'TAB',Space:'SPACE',Minus:'MINUS',Equal:'EQUAL',BracketLeft:'LEFT_BRACKET',BracketRight:'RIGHT_BRACKET',Backslash:'BACKSLASH',Semicolon:'SEMICOLON',Quote:'QUOTE',Backquote:'GRAVE',Comma:'COMMA',Period:'PERIOD',Slash:'SLASH',CapsLock:'CAPS_LOCK',PrintScreen:'PRINT_SCREEN',ScrollLock:'SCROLL_LOCK',Pause:'PAUSE',Insert:'INSERT',Home:'HOME',PageUp:'PAGE_UP',Delete:'DELETE',End:'END',PageDown:'PAGE_DOWN',ArrowRight:'RIGHT',ArrowLeft:'LEFT',ArrowDown:'DOWN',ArrowUp:'UP'};
const canonical=keys=>keys.map(key=>key.replace(/^R(CTRL|SHIFT|ALT|META)$/,'$1')).sort().join('+');
export function eventChord(event){
 if(!['keyDown','keydown'].includes(event.type)||event.isComposing)return null;
 const code=event.code||'';
 const key=codes[code]||(/^Key[A-Z]$/.test(code)?code.slice(3):/^Digit[0-9]$/.test(code)?code.slice(5):/^F([1-9]|1[0-9]|2[0-4])$/.test(code)?code:null);
 if(!key)return null;
 return [...(event.control?['CTRL']:[]),...(event.shift?['SHIFT']:[]),...(event.alt?['ALT']:[]),...(event.meta?['META']:[]),key];
}
export function matchInput(chord,actions){
 if(!chord)return [];
 const result=[];
 (actions||[]).forEach((records,layer)=>records.forEach((action,index)=>{if(action?.type==='key'&&canonical(action.keys)===canonical(chord))result.push({layer:layer+1,id:index+1});}));
 return result;
}
export function appendObservation(list,event,expected){
 list.push({event:{...event},expected:structuredClone(expected)});
 if(list.length>200)list.splice(0,list.length-200);
}

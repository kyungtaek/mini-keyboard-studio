const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('miniKeyboardDesktop',{
 version:1,
 getLanguage:()=>ipcRenderer.invoke('mini:language'),
 setLanguage:locale=>ipcRenderer.invoke('mini:language',locale),
 onLanguage:callback=>{if(typeof callback!=='function')throw TypeError('Language callback must be a function');const listener=(_event,locale)=>callback(locale);ipcRenderer.on('mini:language-changed',listener);return ()=>ipcRenderer.removeListener('mini:language-changed',listener);},
 onConnectionStatus:callback=>{if(typeof callback!=='function')throw TypeError('Connection callback must be a function');const listener=(_event,status)=>callback(status);ipcRenderer.on('mini:connection-status',listener);return ()=>ipcRenderer.removeListener('mini:connection-status',listener);},
 setInputDebug:enabled=>ipcRenderer.invoke('mini:input-debug',enabled),
 onDebugInput:callback=>{const listener=(_event,input)=>callback(input);ipcRenderer.on('mini:debug-input',listener);return ()=>ipcRenderer.removeListener('mini:debug-input',listener);},
 onDebugPaused:callback=>{const listener=(_event,details)=>callback(details);ipcRenderer.on('mini:debug-paused',listener);return ()=>ipcRenderer.removeListener('mini:debug-paused',listener);},
 log:event=>ipcRenderer.invoke('mini:log',event),
 openLogs:()=>ipcRenderer.invoke('mini:open-logs'),
 onAction:callback=>{const listener=(_event,action)=>callback(action);ipcRenderer.on('mini:action',listener);return ()=>ipcRenderer.removeListener('mini:action',listener);},
 catalog:(command,args={})=>ipcRenderer.invoke('mini:catalog',command,args),
 call:(command,args={})=>ipcRenderer.invoke('mini:companion',command,args),
 copyKeymap:url=>ipcRenderer.invoke('mini:copy-keymap',url),
 onKeymap:callback=>{const listener=(_event,url)=>callback(url);ipcRenderer.on('mini:keymap',listener);return ()=>ipcRenderer.removeListener('mini:keymap',listener);}
});

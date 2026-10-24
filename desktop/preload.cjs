const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('miniKeyboardDesktop',{
 version:1,
 call:(command,args={})=>ipcRenderer.invoke('mini:companion',command,args),
 copyKeymap:url=>ipcRenderer.invoke('mini:copy-keymap',url),
 onKeymap:callback=>{const listener=(_event,url)=>callback(url);ipcRenderer.on('mini:keymap',listener);return ()=>ipcRenderer.removeListener('mini:keymap',listener);}
});

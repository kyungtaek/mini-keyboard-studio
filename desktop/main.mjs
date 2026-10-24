import {connectionView} from './connection-status.mjs';
import {app,BrowserWindow,Menu,Tray,nativeImage,protocol,ipcMain,dialog,shell,screen,session,clipboard,safeStorage} from 'electron';
import {readFile,writeFile,mkdir,rename,realpath} from 'node:fs/promises';
import path from 'node:path';
import {createInputDebug} from './input-debug.mjs';
import {createDiagnosticLogger,validateLogEvent} from './logging.mjs';
import {isAppAction} from '../src/navigation.js';
import {SUPPORTED_LOCALES,normalizeLocale,validateLanguageInvocation,nativeText,nativeMenuTemplates} from './locale.mjs';
import {CatalogService} from './catalog-service.mjs';
import {CatalogAuth,validateCatalogInvocation} from './catalog-auth.mjs';
import {createCompanionApi} from './local-api.mjs';
import {CompanionGateway} from '../scripts/companion-api.mjs';
import {APP_URL,assetName,isStudioDocument,validateInvocation,sharedKeymapURL} from './policy.mjs';

protocol.registerSchemesAsPrivileged([{scheme:'mini-keyboard',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.setName('Mini Keyboard Studio');
const single=app.requestSingleInstanceLock();
if(!single){app.quit();}else{
 let window,tray,gateway,inputDebug,settings={},poll,apiServer,quitting=false,allowQuit=false,pendingLink=null,lastStatus={connected:false},lastError='',lastMenuKey='',connectionSequence=0,refreshingStatus=false,refreshStatus=async()=>{};
 const root=app.getAppPath(),dataDir=app.getPath('userData'),settingsFile=path.join(dataDir,'desktop-settings.json');
 const logger=createDiagnosticLogger({directory:path.join(dataDir,'logs')});
 const log=(message,details={},level='error',component='main')=>logger.write({level,component,message,details}).catch(()=>{});
 const fatalLog=(message,error)=>{try{logger.writeSync({level:'error',component:'process',message,details:{error}});}catch{/* Preserve Node's fatal error behavior even if the disk is unavailable. */}};
 process.on('uncaughtExceptionMonitor',error=>fatalLog('Uncaught exception',error));
 process.on('unhandledRejection',reason=>{fatalLog('Unhandled rejection',reason);throw reason instanceof Error?reason:Error('Unhandled promise rejection');});
 const openLogs=async()=>{await mkdir(logger.directory,{recursive:true,mode:0o700});const error=await shell.openPath(logger.directory);if(error)throw Error(error);return true;};
 let settingsWrites=Promise.resolve();
 const saveSettings=()=>{const snapshot=JSON.stringify(settings,null,2);const write=settingsWrites.catch(()=>{}).then(async()=>{const temp=settingsFile+'.tmp';await writeFile(temp,snapshot,{mode:0o600});await rename(temp,settingsFile);});settingsWrites=write;return write;};
 const t=key=>nativeText(settings.language||'en',key);
 let languageChanges=Promise.resolve();
 const setLanguage=locale=>{validateLanguageInvocation([locale]);const change=languageChanges.catch(()=>{}).then(async()=>{if(locale===settings.language)return locale;const previous=settings.language;settings.language=locale;try{await saveSettings();}catch(error){settings.language=previous;throw error;}buildMenu();if(window&&!window.webContents.isDestroyed())window.webContents.send('mini:language-changed',locale);return locale;});languageChanges=change;return change;};
 const show=()=>{if(window){app.dock?.show();window.show();window.focus();}};
 const readLogin=()=>app.getLoginItemSettings();
 async function setLogin(enabled){app.setLoginItemSettings({openAtLogin:enabled});settings.launchAtLogin=enabled;await saveSettings();await recordStatus();buildMenu();}
 async function recordStatus(){await writeFile(path.join(dataDir,'desktop-status.json'),JSON.stringify({version:app.getVersion(),packaged:app.isPackaged,executable:app.getPath('exe'),helper:gateway?.python,backupDir:gateway?.backupDir,userData:dataDir,language:settings.language,login:readLogin(),trayCreated:Boolean(tray),windowVisible:window?.isVisible(),apiEnabled:Boolean(apiServer),apiPort:apiServer?4173:null,connected:lastStatus.connected,capabilities:lastStatus.capabilities,error:lastError,updatedAt:new Date().toISOString()},null,2),{mode:0o600});}
 function sendAction(action){if(!isAppAction(action)||quitting)return;show();if(window&&!window.webContents.isLoading())window.webContents.send('mini:action',action);}
 function buildMenu(){
  if(!tray)return;
  const login=readLogin(),key=JSON.stringify([settings.language,login.openAtLogin,login.status,lastStatus.connected,lastStatus.lightingRecoveryRequired,Boolean(apiServer)]);
  if(key===lastMenuKey)return;lastMenuKey=key;
  const menus=nativeMenuTemplates({locale:settings.language,appName:app.name,connected:lastStatus.connected,recoveryRequired:lastStatus.lightingRecoveryRequired,login,apiEnabled:Boolean(apiServer),packaged:app.isPackaged,handlers:{
   show,data:()=>shell.openPath(dataDir),logs:()=>openLogs().catch(reportError),login:enabled=>setLogin(enabled).catch(reportError),
   approval:()=>shell.openExternal('x-apple.systempreferences:com.apple.LoginItems-Settings.extension'),api:enabled=>toggleAPI(enabled).catch(reportError),quit:()=>app.quit(),action:sendAction,language:locale=>setLanguage(locale).catch(reportError)
  }});
  tray.setToolTip(menus.tooltip);tray.setContextMenu(Menu.buildFromTemplate(menus.tray));Menu.setApplicationMenu(Menu.buildFromTemplate(menus.application));
 }
 async function reportError(error){lastError=error.message;await log('Application error',{error});await recordStatus();dialog.showErrorBox(t('applicationError'),error.message);}
 async function toggleAPI(enabled){
  if(enabled&&!apiServer){
   const server=createCompanionApi(gateway);
   await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4173,'127.0.0.1',resolve);});apiServer=server;
  }else if(!enabled&&apiServer){const server=apiServer;apiServer=null;await new Promise(resolve=>server.close(resolve));}
  settings.apiEnabled=enabled;await saveSettings();await recordStatus();buildMenu();
 }
 async function deliverLink(value){const link=sharedKeymapURL(value);if(!link)return;pendingLink=link;show();if(window&&!window.webContents.isLoading()){window.webContents.send('mini:keymap',pendingLink);pendingLink=null;}}
 app.on('open-url',(event,url)=>{event.preventDefault();deliverLink(url);});
 app.on('second-instance',(_event,argv)=>{const link=argv.find(arg=>sharedKeymapURL(arg));if(link)deliverLink(link);else show();});
 app.on('activate',show);
 app.on('window-all-closed',()=>{});
 app.on('before-quit',event=>{
  inputDebug?.pause('quit');
  if(allowQuit)return;event.preventDefault();if(quitting)return;quitting=true;clearInterval(poll);
  (async()=>{
   try{await languageChanges;await settingsWrites;}catch(error){quitting=false;poll=setInterval(refreshStatus,1000);throw error;}
   if(apiServer){apiServer.close();apiServer=null;}
   try{await gateway?.stop();}
   catch(error){await log(error.stack||error.message);const answer=await dialog.showMessageBox(window,{type:'warning',message:t('quitWarning'),detail:error.message+'\n'+t('backupDetail'),buttons:[t('returnToApp'),t('quit')],defaultId:0,cancelId:0});if(answer.response===0){quitting=false;poll=setInterval(refreshStatus,1000);if(settings.apiEnabled&&!apiServer)try{await toggleAPI(true);}catch(apiError){await log(apiError.message);}show();return;}}
   await log('Application quitting',{},'info');await logger.flush();allowQuit=true;app.quit();
  })().catch(reportError);
 });
 app.whenReady().then(async()=>{
  await mkdir(dataDir,{recursive:true,mode:0o700});
  await log('Application starting',{version:app.getVersion(),packaged:app.isPackaged},'info');
  try{settings=JSON.parse(await readFile(settingsFile,'utf8'));}catch(error){if(error.code!=='ENOENT'){await log(`Settings read failed: ${error.message}`);throw error;}}
  if(!SUPPORTED_LOCALES.includes(settings.language)){settings.language=normalizeLocale(app.getLocale());await saveSettings();}
  const catalogAuth=new CatalogAuth({dataDir,safeStorage});
  const catalog=new CatalogService({cacheDir:path.join(dataDir,'catalog'),getToken:()=>catalogAuth.getToken()});
  let authMutation=false;
  gateway=new CompanionGateway(root,app.isPackaged?{cwd:dataDir,executable:path.join(process.resourcesPath,'hid','mini-keyboard-hid'),args:[],backupDir:path.join(dataDir,'companion-backups')}:{backupDir:path.join(dataDir,'companion-backups')});
  const callGateway=gateway.call.bind(gateway);
  gateway.call=async(command,args)=>{try{return await callGateway(command,args);}catch(error){await log('Helper command failed',{command,error},'error','helper');throw error;}};
  protocol.handle('mini-keyboard',async request=>{
   try{
    if(!['GET','HEAD'].includes(request.method))return new Response('',{status:405});
    const name=assetName(request.url),file=await realpath(path.join(root,name)),base=path.join(root,name==='index.html'?'index.html':name.startsWith('data/')?'data/shortcuts':name.split('/')[0]);
    if(file!==base&&!file.startsWith(base+path.sep))return new Response('',{status:404});
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
    return new Response(request.method==='HEAD'?null:await readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'none'",'X-Content-Type-Options':'nosniff'}});
   }catch{return new Response('Not found',{status:404});}
  });
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  const area=screen.getPrimaryDisplay().workAreaSize;
  window=new BrowserWindow({width:Math.min(1440,area.width),height:Math.min(860,area.height-20),minWidth:850,minHeight:620,show:false,title:'Mini Keyboard Studio',backgroundColor:'#121212',webPreferences:{preload:path.join(root,'desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webviewTag:false}});
  inputDebug=createInputDebug({
   isFocused:()=>!quitting&&!window.isDestroyed()&&window.isVisible()&&window.isFocused(),
   send:(channel,value)=>{try{if(!window.webContents.isDestroyed())window.webContents.send(channel,value);}catch{/* A renderer being torn down cannot receive its pause notice. */}}
  });
  window.webContents.on('before-input-event',(event,input)=>inputDebug.handle(event,input));
  window.on('blur',()=>inputDebug.pause('blur'));
  window.on('hide',()=>inputDebug.pause('hide'));
  window.webContents.on('did-start-navigation',()=>inputDebug.pause('navigation'));
  window.webContents.on('render-process-gone',()=>inputDebug.pause('render-process-gone'));
  const validateSender=event=>validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,'status',{});
  ipcMain.handle('mini:language',async(event,...args)=>{validateSender(event);const locale=validateLanguageInvocation(args);if(locale===null)return settings.language;if(quitting)throw Error(t('quitting'));return setLanguage(locale);});
  ipcMain.handle('mini:input-debug',(event,value)=>{validateSender(event);return inputDebug.set(value);});
  ipcMain.handle('mini:log',async(event,value)=>{validateSender(event);const safe=validateLogEvent(value);await logger.write(safe);return true;});
  ipcMain.handle('mini:open-logs',async event=>{validateSender(event);return openLogs();});
  ipcMain.handle('mini:companion',async(event,command,args)=>{
   if(quitting)throw Error(t('quitting'));
   validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,command,args);
   const result=await gateway.call(command,args);return result;
  });
  ipcMain.handle('mini:catalog',async(event,command,args={})=>{
   if(quitting)throw Error(t('quitting'));
   validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,'status',{});
   validateCatalogInvocation(command,args);
   if(command==='list')return catalog.list();
   if(command==='download')return catalog.download(args.id);
   if(command==='auth-status')return catalogAuth.status();
   if(authMutation)throw Error(t('authBusy'));
   authMutation=true;
   try{
    if(command==='clear-token')return await catalogAuth.clear();
    // Verify repository access before replacing the previous encrypted credential.
    const verifier=new CatalogService({cacheDir:path.join(dataDir,'catalog-auth-check'),getToken:async()=>args.token});
    await verifier.request('/git/ref/heads/main',128*1024);
    return await catalogAuth.save(args.token);
   }finally{authMutation=false;}
  });
  ipcMain.handle('mini:copy-keymap',(event,url)=>{
   validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,'status',{});
   if(!sharedKeymapURL(url))throw Error(t('invalidLink'));clipboard.writeText(url);return true;
  });
  window.on('close',event=>{if(!allowQuit){event.preventDefault();window.hide();app.dock?.hide();}});
  window.on('hide',()=>{recordStatus().catch(error=>log(error.message));});window.on('show',()=>{recordStatus().catch(error=>log(error.message));});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!isStudioDocument(url))event.preventDefault();});
  window.webContents.on('console-message',details=>{log(details.message,{lineNumber:details.lineNumber},details.level==='error'?'error':details.level==='warning'?'warn':'info','renderer');});
  window.webContents.on('render-process-gone',(_event,details)=>log('Renderer process exited',{reason:details.reason,exitCode:details.exitCode},'error','renderer'));
  window.webContents.on('did-finish-load',()=>{if(pendingLink){window.webContents.send('mini:keymap',pendingLink);pendingLink=null;}});
  const image=nativeImage.createFromPath(path.join(root,'desktop/icons/trayTemplate.png'));image.setTemplateImage(true);tray=new Tray(image);tray.on('click',show);buildMenu();
  if(app.isPackaged){app.setAsDefaultProtocolClient('mini-keyboard');if(settings.launchAtLogin===undefined)await setLogin(true);}
  if(settings.apiEnabled)try{await toggleAPI(true);}catch(error){await reportError(error);}
  await window.loadURL(APP_URL);
  if(!process.argv.includes('--hidden')&&!readLogin().wasOpenedAtLogin)show();else app.dock?.hide();
  const publishConnection=()=>{const view=connectionView(lastStatus);if(window&&!window.webContents.isDestroyed())window.webContents.send('mini:connection-status',{...view,sequence:++connectionSequence});};
  refreshStatus=async()=>{if(quitting||refreshingStatus)return;refreshingStatus=true;try{lastStatus=await gateway.call('status');lastError='';publishConnection();buildMenu();await recordStatus();}catch(error){lastError=error.message;lastStatus={...lastStatus,connected:false,connectionState:'unknown',connectionError:error.message};publishConnection();buildMenu();await log(error.message);await recordStatus().catch(statusError=>log('Status file write failed',{code:statusError.code},'warn'));}finally{refreshingStatus=false;}};
  await refreshStatus();poll=setInterval(refreshStatus,1000);
 }).catch(async error=>{await log('Application startup failed',{error});dialog.showErrorBox(t('startupError'),error.message);allowQuit=true;app.quit();});
}

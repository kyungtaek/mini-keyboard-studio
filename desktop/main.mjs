import {app,BrowserWindow,Menu,Tray,nativeImage,protocol,ipcMain,dialog,shell,screen,session,clipboard,safeStorage} from 'electron';
import {readFile,writeFile,mkdir,rename,realpath} from 'node:fs/promises';
import path from 'node:path';
import {createDiagnosticLogger,validateLogEvent} from './logging.mjs';
import {appMenuGroups,isAppAction} from '../src/navigation.js';
import {CatalogService} from './catalog-service.mjs';
import {CatalogAuth,validateCatalogInvocation} from './catalog-auth.mjs';
import {createCompanionApi} from './local-api.mjs';
import {CompanionGateway} from '../scripts/companion-api.mjs';
import {APP_URL,assetName,isStudioDocument,validateInvocation,sharedKeymapURL} from './policy.mjs';

protocol.registerSchemesAsPrivileged([{scheme:'mini-keyboard',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.setName('Mini Keyboard Studio');
const single=app.requestSingleInstanceLock();
if(!single){app.quit();}else{
 let window,tray,gateway,settings={},poll,apiServer,quitting=false,allowQuit=false,pendingLink=null,lastStatus={connected:false},lastError='',lastMenuKey='',refreshStatus=async()=>{};
 const root=app.getAppPath(),dataDir=app.getPath('userData'),settingsFile=path.join(dataDir,'desktop-settings.json');
 const logger=createDiagnosticLogger({directory:path.join(dataDir,'logs')});
 const log=(message,details={},level='error',component='main')=>logger.write({level,component,message,details}).catch(()=>{});
 const fatalLog=(message,error)=>{try{logger.writeSync({level:'error',component:'process',message,details:{error}});}catch{/* Preserve Node's fatal error behavior even if the disk is unavailable. */}};
 process.on('uncaughtExceptionMonitor',error=>fatalLog('Uncaught exception',error));
 process.on('unhandledRejection',reason=>{fatalLog('Unhandled rejection',reason);throw reason instanceof Error?reason:Error('Unhandled promise rejection');});
 const openLogs=async()=>{await mkdir(logger.directory,{recursive:true,mode:0o700});const error=await shell.openPath(logger.directory);if(error)throw Error(error);return true;};
 const saveSettings=async()=>{const temp=settingsFile+'.tmp';await writeFile(temp,JSON.stringify(settings,null,2),{mode:0o600});await rename(temp,settingsFile);};
 const show=()=>{if(window){app.dock?.show();window.show();window.focus();}};
 const readLogin=()=>app.getLoginItemSettings();
 async function setLogin(enabled){app.setLoginItemSettings({openAtLogin:enabled});settings.launchAtLogin=enabled;await saveSettings();await recordStatus();buildMenu();}
 async function recordStatus(){await writeFile(path.join(dataDir,'desktop-status.json'),JSON.stringify({version:app.getVersion(),packaged:app.isPackaged,executable:app.getPath('exe'),helper:gateway?.python,backupDir:gateway?.backupDir,userData:dataDir,login:readLogin(),trayCreated:Boolean(tray),windowVisible:window?.isVisible(),apiEnabled:Boolean(apiServer),apiPort:apiServer?4173:null,connected:lastStatus.connected,capabilities:lastStatus.capabilities,error:lastError,updatedAt:new Date().toISOString()},null,2),{mode:0o600});}
 function sendAction(action){if(!isAppAction(action)||quitting)return;show();if(window&&!window.webContents.isLoading())window.webContents.send('mini:action',action);}
 function buildMenu(){if(!tray)return;const login=readLogin(),key=JSON.stringify([login.openAtLogin,login.status,lastStatus.connected,lastStatus.lightingRecoveryRequired,Boolean(apiServer)]);if(key===lastMenuKey)return;lastMenuKey=key;tray.setToolTip(`Mini Keyboard Studio · ${lastStatus.connected?'키보드 연결됨':'키보드 연결 전'}`);const items=[
  {label:'Mini Keyboard Studio',enabled:false},
  {label:lastStatus.connected?'● 키보드 연결됨':'○ 키보드 연결 전',enabled:false},
  ...(lastStatus.lightingRecoveryRequired?[{label:'LED 원본 복구 필요 · 상태·LED에서 복원',enabled:false}]:[]),
  {type:'separator'},{label:'설정 열기',click:show},{label:'데이터 폴더 열기',click:()=>shell.openPath(dataDir)},{label:'로그 폴더 열기',click:()=>openLogs().catch(reportError)},
  {label:'로그인 시 자동 실행',type:'checkbox',checked:login.openAtLogin,enabled:app.isPackaged,click:item=>setLogin(item.checked).catch(reportError)},
  ...(login.status==='requires-approval'?[{label:'로그인 항목 승인 필요',click:()=>shell.openExternal('x-apple.systempreferences:com.apple.LoginItems-Settings.extension')}]:[]),
  {label:'Codex 연동용 로컬 API',type:'checkbox',checked:Boolean(apiServer),click:()=>toggleAPI(!apiServer).catch(reportError)},
  {type:'separator'},{label:'종료',accelerator:'Command+Q',click:()=>app.quit()}
 ];tray.setContextMenu(Menu.buildFromTemplate(items));Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:app.name,submenu:[{role:'about'},{type:'separator'},...items.slice(2,-2),{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},items.at(-1)]},
  ...appMenuGroups.slice(0,1).map(group=>({label:group.label,submenu:group.items.map(item=>({label:item.label,...(item.accelerator?{accelerator:item.accelerator}:{}),click:()=>sendAction(item.action)}))})),
  {label:'편집',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
  ...appMenuGroups.slice(1).map(group=>({label:group.label,submenu:group.items.map(item=>({label:item.label,...(item.accelerator?{accelerator:item.accelerator}:{}),click:()=>sendAction(item.action)}))})),
  {label:'보기',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]}
 ]));}
 async function reportError(error){lastError=error.message;await log('Application error',{error});await recordStatus();dialog.showErrorBox('Mini Keyboard Studio',error.message);}
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
  if(allowQuit)return;event.preventDefault();if(quitting)return;quitting=true;clearInterval(poll);
  (async()=>{
   if(apiServer){apiServer.close();apiServer=null;}
   try{await gateway?.stop();}
   catch(error){await log(error.stack||error.message);const answer=await dialog.showMessageBox(window,{type:'warning',message:'장치 복구·종료를 확인하지 못했습니다.',detail:error.message+'\n원본 백업은 데이터 폴더에 보관되어 있습니다.',buttons:['앱으로 돌아가기','종료'],defaultId:0,cancelId:0});if(answer.response===0){quitting=false;poll=setInterval(refreshStatus,5000);if(settings.apiEnabled&&!apiServer)try{await toggleAPI(true);}catch(apiError){await log(apiError.message);}show();return;}}
   await log('Application quitting',{},'info');await logger.flush();allowQuit=true;app.quit();
  })().catch(reportError);
 });
 app.whenReady().then(async()=>{
  await mkdir(dataDir,{recursive:true,mode:0o700});
  await log('Application starting',{version:app.getVersion(),packaged:app.isPackaged},'info');
  try{settings=JSON.parse(await readFile(settingsFile,'utf8'));}catch(error){if(error.code!=='ENOENT'){await log(`Settings read failed: ${error.message}`);throw error;}}
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
  const validateSender=event=>validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,'status',{});
  ipcMain.handle('mini:log',async(event,value)=>{validateSender(event);const safe=validateLogEvent(value);await logger.write(safe);return true;});
  ipcMain.handle('mini:open-logs',async event=>{validateSender(event);return openLogs();});
  ipcMain.handle('mini:companion',async(event,command,args)=>{
   if(quitting)throw Error('앱이 종료 중입니다.');
   validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,command,args);
   const result=await gateway.call(command,args);return result;
  });
  ipcMain.handle('mini:catalog',async(event,command,args={})=>{
   if(quitting)throw Error('앱이 종료 중입니다.');
   validateInvocation({url:event.senderFrame?.url,mainFrame:event.senderFrame===window.webContents.mainFrame,senderId:event.sender.id},window.webContents.id,'status',{});
   validateCatalogInvocation(command,args);
   if(command==='list')return catalog.list();
   if(command==='download')return catalog.download(args.id);
   if(command==='auth-status')return catalogAuth.status();
   if(authMutation)throw Error('GitHub 인증을 변경 중입니다.');
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
   if(!sharedKeymapURL(url))throw Error('잘못된 공유 링크입니다.');clipboard.writeText(url);return true;
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
  refreshStatus=async()=>{if(quitting)return;try{lastStatus=await gateway.call('status');lastError='';buildMenu();await recordStatus();}catch(error){lastError=error.message;await log(error.message);await recordStatus().catch(statusError=>log('Status file write failed',{code:statusError.code},'warn'));}};
  await refreshStatus();poll=setInterval(refreshStatus,5000);
 }).catch(async error=>{await log('Application startup failed',{error});dialog.showErrorBox('앱을 시작하지 못했습니다',error.message);allowQuit=true;app.quit();});
}

import {appMenuGroups} from '../src/navigation.js';

export const SUPPORTED_LOCALES=Object.freeze(['en','ko','ja','es','zh-CN','zh-TW']);
const selfNames=['English','한국어','日本語','Español','简体中文','繁體中文'];
export function normalizeLocale(value){
 if(typeof value!=='string')return 'en';
 const tag=value.toLowerCase().replaceAll('_','-'),base=tag.split('-')[0];
 if(base==='zh')return /(?:^|-)(hant|tw|hk|mo)(?:-|$)/.test(tag)?'zh-TW':'zh-CN';
 return ['en','ko','ja','es'].includes(base)?base:'en';
}
export function validateLanguageInvocation(args){
 if(args.length===0)return null;
 if(args.length!==1||!SUPPORTED_LOCALES.includes(args[0]))throw Error('Unsupported language');
 return args[0];
}
const messages={
 en:{connected:'Keyboard connected',disconnected:'Keyboard disconnected',recovery:'LED recovery needed · Restore in Status & LED',open:'Open settings',data:'Open data folder',logs:'Open logs folder',login:'Launch at login',approval:'Login item approval required',api:'Local API for Codex',language:'Language',quit:'Quit',file:'File',keymap:'Keymap',device:'Device',edit:'Edit',view:'View',files:'Open / export file…',save:'Save keymap',new:'New keymap',presets:'Keymap catalog…',devices:'Manage devices…',backups:'Device backups…',lighting:'Status & LED…','input-debug':'Key input diagnostics…',quitWarning:'Could not confirm device recovery and shutdown.',backupDetail:'Original backups are stored in the data folder.',returnToApp:'Return to app',startupError:'Could not start the app',quitting:'The app is shutting down.',authBusy:'GitHub authentication is being changed.',invalidLink:'Invalid shared link.',applicationError:'Application error'},
 ko:{connected:'키보드 연결됨',disconnected:'키보드 연결 전',recovery:'LED 원본 복구 필요 · 상태·LED에서 복원',open:'설정 열기',data:'데이터 폴더 열기',logs:'로그 폴더 열기',login:'로그인 시 자동 실행',approval:'로그인 항목 승인 필요',api:'Codex 연동용 로컬 API',language:'언어',quit:'종료',file:'파일',keymap:'키맵',device:'장치',edit:'편집',view:'보기',files:'파일 열기·내보내기…',save:'키맵 저장',new:'새 키맵',presets:'키맵 카탈로그…',devices:'장치 관리…',backups:'장치 백업…',lighting:'상태·LED…','input-debug':'키 입력 진단…',quitWarning:'장치 복구·종료를 확인하지 못했습니다.',backupDetail:'원본 백업은 데이터 폴더에 보관되어 있습니다.',returnToApp:'앱으로 돌아가기',startupError:'앱을 시작하지 못했습니다',quitting:'앱이 종료 중입니다.',authBusy:'GitHub 인증을 변경 중입니다.',invalidLink:'잘못된 공유 링크입니다.',applicationError:'앱 오류'},
 ja:{connected:'キーボード接続済み',disconnected:'キーボード未接続',recovery:'LEDの復元が必要 · 状態・LEDで復元',open:'設定を開く',data:'データフォルダを開く',logs:'ログフォルダを開く',login:'ログイン時に起動',approval:'ログイン項目の承認が必要',api:'Codex連携用ローカルAPI',language:'言語',quit:'終了',file:'ファイル',keymap:'キーマップ',device:'デバイス',edit:'編集',view:'表示',files:'ファイルを開く・書き出す…',save:'キーマップを保存',new:'新規キーマップ',presets:'キーマップカタログ…',devices:'デバイス管理…',backups:'デバイスのバックアップ…',lighting:'状態・LED…','input-debug':'キー入力の診断…',quitWarning:'デバイスの復元と終了を確認できませんでした。',backupDetail:'元のバックアップはデータフォルダに保存されています。',returnToApp:'アプリに戻る',startupError:'アプリを起動できませんでした',quitting:'アプリを終了しています。',authBusy:'GitHub認証を変更しています。',invalidLink:'共有リンクが無効です。',applicationError:'アプリのエラー'},
 es:{connected:'Teclado conectado',disconnected:'Teclado desconectado',recovery:'Se necesita restaurar los LED · Abrir Estado y LED',open:'Abrir ajustes',data:'Abrir carpeta de datos',logs:'Abrir carpeta de registros',login:'Iniciar al iniciar sesión',approval:'Se requiere aprobar el inicio de sesión',api:'API local para Codex',language:'Idioma',quit:'Salir',file:'Archivo',keymap:'Mapa de teclas',device:'Dispositivo',edit:'Edición',view:'Ver',files:'Abrir / exportar archivo…',save:'Guardar mapa de teclas',new:'Nuevo mapa de teclas',presets:'Catálogo de mapas…',devices:'Administrar dispositivos…',backups:'Copias del dispositivo…',lighting:'Estado y LED…','input-debug':'Diagnóstico de teclas…',quitWarning:'No se pudo confirmar la restauración y el cierre del dispositivo.',backupDetail:'Las copias originales se guardan en la carpeta de datos.',returnToApp:'Volver a la app',startupError:'No se pudo iniciar la app',quitting:'La app se está cerrando.',authBusy:'Se está cambiando la autenticación de GitHub.',invalidLink:'Enlace compartido no válido.',applicationError:'Error de la aplicación'},
 'zh-CN':{connected:'键盘已连接',disconnected:'键盘未连接',recovery:'需要恢复 LED · 请在状态与 LED 中恢复',open:'打开设置',data:'打开数据文件夹',logs:'打开日志文件夹',login:'登录时自动启动',approval:'需要批准登录项',api:'用于 Codex 的本地 API',language:'语言',quit:'退出',file:'文件',keymap:'键位映射',device:'设备',edit:'编辑',view:'视图',files:'打开或导出文件…',save:'保存键位映射',new:'新建键位映射',presets:'键位映射目录…',devices:'管理设备…',backups:'设备备份…',lighting:'状态与 LED…','input-debug':'按键输入诊断…',quitWarning:'无法确认设备恢复和关闭。',backupDetail:'原始备份保存在数据文件夹中。',returnToApp:'返回应用',startupError:'无法启动应用',quitting:'应用正在退出。',authBusy:'正在更改 GitHub 身份验证。',invalidLink:'共享链接无效。',applicationError:'应用错误'},
 'zh-TW':{connected:'鍵盤已連線',disconnected:'鍵盤未連線',recovery:'需要還原 LED · 請在狀態與 LED 中還原',open:'開啟設定',data:'開啟資料資料夾',logs:'開啟記錄資料夾',login:'登入時自動啟動',approval:'需要核准登入項目',api:'供 Codex 使用的本機 API',language:'語言',quit:'結束',file:'檔案',keymap:'按鍵對應',device:'裝置',edit:'編輯',view:'顯示方式',files:'開啟或匯出檔案…',save:'儲存按鍵對應',new:'新增按鍵對應',presets:'按鍵對應目錄…',devices:'管理裝置…',backups:'裝置備份…',lighting:'狀態與 LED…','input-debug':'按鍵輸入診斷…',quitWarning:'無法確認裝置還原與關閉。',backupDetail:'原始備份儲存在資料資料夾中。',returnToApp:'返回應用程式',startupError:'無法啟動應用程式',quitting:'應用程式正在結束。',authBusy:'正在變更 GitHub 驗證。',invalidLink:'分享連結無效。',applicationError:'應用程式錯誤'}
};
// Explicit labels follow the in-app language; roles still supply native behavior.
const roleNames=['about','hide','hideOthers','unhide','undo','redo','cut','copy','paste','selectAll','resetZoom','zoomIn','zoomOut','togglefullscreen'];
const roleLabels={
 en:['About {app}','Hide {app}','Hide Others','Show All','Undo','Redo','Cut','Copy','Paste','Select All','Actual Size','Zoom In','Zoom Out','Toggle Full Screen'],
 ko:['{app} 정보','{app} 가리기','기타 가리기','모두 보기','실행 취소','실행 복귀','오려두기','복사하기','붙여넣기','모두 선택','실제 크기','확대','축소','전체 화면 전환'],
 ja:['{app}について','{app}を非表示','ほかを非表示','すべてを表示','取り消す','やり直す','カット','コピー','ペースト','すべてを選択','実際のサイズ','拡大','縮小','フルスクリーン切り替え'],
 es:['Acerca de {app}','Ocultar {app}','Ocultar otras','Mostrar todo','Deshacer','Rehacer','Cortar','Copiar','Pegar','Seleccionar todo','Tamaño real','Ampliar','Reducir','Alternar pantalla completa'],
 'zh-CN':['关于 {app}','隐藏 {app}','隐藏其他','全部显示','撤销','重做','剪切','复制','粘贴','全选','实际大小','放大','缩小','切换全屏'],
 'zh-TW':['關於 {app}','隱藏 {app}','隱藏其他','全部顯示','復原','重做','剪下','拷貝','貼上','全選','實際大小','放大','縮小','切換全螢幕']
};
export function nativeText(locale,key){const normalized=normalizeLocale(locale),value=messages[normalized][key]??roleLabels[normalized][roleNames.indexOf(key)];if(value===undefined)throw Error(`Unknown native message: ${key}`);return value;}

// Keep identifiers and accelerators independent of the displayed language.
export function nativeMenuTemplates({locale,appName,connected=false,recoveryRequired=false,login={},apiEnabled=false,packaged=false,handlers={}}){
 const t=key=>nativeText(locale,key),call=name=>(...args)=>handlers[name]?.(...args);
 const role=name=>({role:name,label:t(name).replace('{app}',appName)});
 const language=()=>({id:'language',label:t('language'),submenu:SUPPORTED_LOCALES.map((value,index)=>({id:`language:${value}`,label:selfNames[index],type:'radio',checked:value===locale,click:()=>handlers.language?.(value)}))});
 const shared=()=>[
  ...(recoveryRequired?[{id:'recovery',label:t('recovery'),enabled:false}]:[]),
  {type:'separator'},{id:'open',label:t('open'),click:call('show')},{id:'data',label:t('data'),click:call('data')},{id:'logs',label:t('logs'),click:call('logs')},
  {id:'login',label:t('login'),type:'checkbox',checked:Boolean(login.openAtLogin),enabled:packaged,click:item=>handlers.login?.(item.checked)},
  ...(login.status==='requires-approval'?[{id:'approval',label:t('approval'),click:call('approval')}]:[]),
  {id:'api',label:t('api'),type:'checkbox',checked:apiEnabled,click:()=>handlers.api?.(!apiEnabled)},language()
 ];
 const quit=()=>({id:'quit',label:t('quit'),accelerator:'Command+Q',click:call('quit')});
 const groups=appMenuGroups.map((group,index)=>({id:`menu:${['file','keymap','device'][index]}`,label:t(['file','keymap','device'][index]),submenu:group.items.map(item=>({id:item.action,label:t(item.action),...(item.accelerator?{accelerator:item.accelerator}:{}),click:()=>handlers.action?.(item.action)}))}));
 return {
  tooltip:`${appName} · ${t(connected?'connected':'disconnected')}`,
  tray:[{label:appName,enabled:false},{id:'connection',label:`${connected?'●':'○'} ${t(connected?'connected':'disconnected')}`,enabled:false},...shared(),{type:'separator'},quit()],
  application:[{label:appName,submenu:[role('about'),...shared(),{type:'separator'},role('hide'),role('hideOthers'),role('unhide'),{type:'separator'},quit()]},groups[0],{id:'menu:edit',label:t('edit'),submenu:[role('undo'),role('redo'),{type:'separator'},role('cut'),role('copy'),role('paste'),role('selectAll')]},...groups.slice(1),{id:'menu:view',label:t('view'),submenu:[role('resetZoom'),role('zoomIn'),role('zoomOut'),role('togglefullscreen')]}]
 };
}

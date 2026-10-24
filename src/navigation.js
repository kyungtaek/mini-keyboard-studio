// Native menus may open tools, but never directly trigger a hardware write.
export const APP_ACTIONS=Object.freeze(['files','new','save','presets','devices','backups','lighting']);
export const isAppAction=value=>typeof value==='string'&&APP_ACTIONS.includes(value);
export const appMenuGroups=[
 {label:'파일',items:[{label:'파일 열기·내보내기…',action:'files',accelerator:'CmdOrCtrl+O'},{label:'키맵 저장',action:'save',accelerator:'CmdOrCtrl+S'}]},
 {label:'키맵',items:[{label:'새 키맵',action:'new',accelerator:'CmdOrCtrl+N'},{label:'키맵 카탈로그…',action:'presets',accelerator:'CmdOrCtrl+Shift+K'}]},
 {label:'장치',items:[{label:'장치 관리…',action:'devices',accelerator:'CmdOrCtrl+Shift+D'},{label:'장치 백업…',action:'backups'},{label:'상태·LED…',action:'lighting'}]}
];

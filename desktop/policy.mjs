import {publicPath} from '../scripts/static-path.mjs';
import {commands} from '../scripts/companion-api.mjs';
export const APP_URL='mini-keyboard://studio/';
function parsed(value){const url=new URL(value);if(url.protocol!=='mini-keyboard:'||url.hostname!=='studio'||url.port||url.username||url.password)throw Error('허용되지 않은 앱 주소');return url;}
export function assetName(value){return publicPath(parsed(value).pathname);}
export function isStudioDocument(value){try{const url=parsed(value);return ['/', '/index.html'].includes(url.pathname)&&!url.search;}catch{return false;}}
export function validateInvocation(info,expectedId,command,args){
 if(info.senderId!==expectedId||!info.mainFrame||!isStudioDocument(info.url))throw Error('앱 창에서만 요청할 수 있습니다.');
 if(!commands.has(command)||!args||typeof args!=='object'||Array.isArray(args)||Buffer.byteLength(JSON.stringify(args))>128*1024)throw Error('허용되지 않은 앱 명령');
}
export function sharedKeymapURL(value){try{const url=parsed(value);return isStudioDocument(value)&&value.length<=128*1024&&/^#keymap=[A-Za-z0-9_-]+$/.test(url.hash)?url.href:null;}catch{return null;}}

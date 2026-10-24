import test from 'node:test';
import assert from 'node:assert/strict';
import {assetName,isStudioDocument,validateInvocation,sharedKeymapURL} from '../desktop/policy.mjs';

test('desktop assets and IPC trust only the exact bundled top-level document',()=>{
 assert.equal(assetName('mini-keyboard://studio/src/app.js'),'src/app.js');
 assert.equal(assetName('mini-keyboard://studio/'),'index.html');
 for(const url of ['file:///etc/passwd','https://studio/','mini-keyboard://evil/index.html','mini-keyboard://studio/device-backups/a.json','mini-keyboard://studio/src/%2e%2e%2fcompanion/bridge.py'])assert.throws(()=>assetName(url));
 assert.equal(isStudioDocument('mini-keyboard://studio/#keymap=abc'),true);
 assert.equal(isStudioDocument('mini-keyboard://studio/src/app.js'),false);
 assert.equal(isStudioDocument('mini-keyboard://studio:80/'),false);
 assert.doesNotThrow(()=>validateInvocation({url:'mini-keyboard://studio/',mainFrame:true,senderId:7},7,'status',{}));
 for(const info of [{url:'https://evil.test/',mainFrame:true,senderId:7},{url:'mini-keyboard://studio/',mainFrame:false,senderId:7},{url:'mini-keyboard://studio/',mainFrame:true,senderId:8}])assert.throws(()=>validateInvocation(info,7,'open',{}));
 assert.throws(()=>validateInvocation({url:'mini-keyboard://studio/',mainFrame:true,senderId:7},7,'shell',{command:'ls'}));
 assert.throws(()=>validateInvocation({url:'mini-keyboard://studio/',mainFrame:true,senderId:7},7,'state',{data:'x'.repeat(128*1024)}));
});
test('desktop share links accept only bounded keymap fragments at the app root',()=>{
 assert.equal(sharedKeymapURL('mini-keyboard://studio/#keymap=abc'),'mini-keyboard://studio/#keymap=abc');
 for(const url of ['https://evil.test/#keymap=abc','mini-keyboard://studio/src/app.js#keymap=abc','mini-keyboard://studio/#other=abc','mini-keyboard://studio/#keymap='+ 'x'.repeat(128*1024)])assert.equal(sharedKeymapURL(url),null);
});

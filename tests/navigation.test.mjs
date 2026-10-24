import test from 'node:test';
import assert from 'node:assert/strict';
import {APP_ACTIONS,isAppAction,appMenuGroups} from '../src/navigation.js';
test('native app menus only dispatch supported workbench actions',()=>{
 assert.deepEqual(appMenuGroups.map(group=>group.label),['파일','키맵','장치']);
 for(const group of appMenuGroups)for(const item of group.items)assert.ok(isAppAction(item.action));
 for(const value of ['apply','connect','shell','../../file',null,{},'__proto__'])assert.equal(isAppAction(value),false);
 assert.equal(new Set(APP_ACTIONS).size,APP_ACTIONS.length);
});

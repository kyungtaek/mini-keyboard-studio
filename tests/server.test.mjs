import test from 'node:test';
import assert from 'node:assert/strict';
import {publicPath} from '../scripts/static-path.mjs';
test('static serving refuses decoded traversal and non-public repository paths',()=>{
 for(const route of ['/src/..%2fdocs/design.md','/src/%2e%2e%2fpackage.json','/src/../.env','/src/%5c..%5c.env','/.venv/bin/python','/device-backups/original.json','/evidence/rea-evidence.json'])assert.throws(()=>publicPath(route),/Not found/);
 assert.equal(publicPath('/src/app.js'),'src/app.js');assert.equal(publicPath('/'),'index.html');assert.equal(publicPath('/presets/index.json'),'presets/index.json');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {seedDesktopLibrary} from '../src/desktop.js';
import {loadLibrary} from '../src/profile.js';
test('desktop seeds five general-mapping samples once and preserves user changes and corrupt storage',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const fetcher=async name=>({ok:true,json:async()=>JSON.parse(await readFile(new URL('../'+name.replace(/^\.\//,''),import.meta.url),'utf8'))});
 await seedDesktopLibrary({storage,fetcher});assert.equal(loadLibrary(storage).length,5);
 const raw=storage.getItem('mini-keyboard-studio.library.v1');
 await seedDesktopLibrary({storage,fetcher});assert.equal(storage.getItem('mini-keyboard-studio.library.v1'),raw);
 const broken={getItem:k=>k==='mini-keyboard-studio.library.v1'?'broken':null,setItem:()=>assert.fail('corrupt data must be preserved')};
 await assert.rejects(seedDesktopLibrary({storage:broken,fetcher}),/보관함/);
});

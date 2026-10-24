import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {CatalogService} from '../desktop/catalog-service.mjs';
const profile=await readFile(new URL('../presets/sample-vscode-mac.json',import.meta.url));
const manifest=JSON.parse(await readFile(new URL('./fixtures/catalog.json',import.meta.url)));
manifest.entries=manifest.entries.slice(0,1);manifest.entries[0].sha256=createHash('sha256').update(profile).digest('hex');
const sha='a'.repeat(40);
async function setup(t){const cacheDir=await mkdtemp(path.join(os.tmpdir(),'catalog-'));t.after(()=>rm(cacheDir,{recursive:true,force:true}));let offline=false,body=profile;const urls=[];
 const service=new CatalogService({cacheDir,getToken:async()=> 'secret',fetcher:async(url,options)=>{urls.push(url);assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer secret');if(offline)throw Error('network unavailable');return new Response(url.includes('/git/ref/')?JSON.stringify({object:{sha,type:'commit'}}):url.includes('catalog.json')?JSON.stringify(manifest):body);}});
 return {service,urls,cacheDir,setOffline:()=>offline=true,setBody:value=>body=value};}
test('pins profile to immutable manifest commit and revalidates offline cached bytes',async t=>{const x=await setup(t);assert.equal((await x.service.list()).commit,sha);const result=await x.service.download(manifest.entries[0].id);assert.equal(result.profile.id,manifest.entries[0].id);assert.equal(result.source,'github');assert.ok(x.urls.at(-1).endsWith('?ref='+sha));x.setOffline();assert.equal((await x.service.list()).offline,true);assert.equal((await x.service.download(result.entry.id)).source,'cache');await writeFile(path.join(x.cacheDir,result.entry.sha256+'.json'),'{}');await assert.rejects(x.service.download(result.entry.id),/SHA-256/);});
test('tampered remote profile never reaches caller or cache',async t=>{const x=await setup(t);await x.service.list();x.setBody(Buffer.from('{}'));await assert.rejects(x.service.download(manifest.entries[0].id),/SHA-256/);});
test('authentication and response size failures are explicit',async t=>{const x=await setup(t);const service=new CatalogService({cacheDir:x.cacheDir,getToken:async()=>null});await assert.rejects(service.list(),/GitHub/);const denied=new CatalogService({cacheDir:x.cacheDir,getToken:async()=> 'secret',fetcher:async()=>new Response('',{status:404})});await assert.rejects(denied.list(),/404/);const large=new CatalogService({cacheDir:x.cacheDir,getToken:async()=> 'secret',fetcher:async()=>new Response('x'.repeat(300000))});await assert.rejects(large.list(),/크기/);});
test('corrupted local profile can be repaired online from the pinned commit',async t=>{const x=await setup(t);await x.service.list();const entry=manifest.entries[0];await writeFile(path.join(x.cacheDir,entry.sha256+'.json'),'{}');const result=await x.service.download(entry.id);assert.equal(result.source,'github');assert.equal(result.profile.id,entry.id);});

test('oversized corrupted local profile is also repaired from the pinned commit',async t=>{const x=await setup(t);await x.service.list();const entry=manifest.entries[0];await writeFile(path.join(x.cacheDir,entry.sha256+'.json'),'x'.repeat(150000));assert.equal((await x.service.download(entry.id)).source,'github');});

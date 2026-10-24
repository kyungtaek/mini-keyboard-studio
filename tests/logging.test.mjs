import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,stat,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createDiagnosticLogger,sanitizeLogEvent,validateLogEvent} from '../desktop/logging.mjs';

test('redacts credentials and device payload fields while retaining bounded diagnostics',()=>{
 const event=sanitizeLogEvent({level:'error',component:'device',message:'Bearer abc.def ghp_abcdefgh github_pat_abcdefgh token=secret',details:{serialNumber:'device-private',keymap:{raw:'private'},authorization:'private',stack:'trace\n'.repeat(1000),nested:{access_token:'private',phase:'verify'}}});
 const value=JSON.stringify(event);
 const consoleEvent=sanitizeLogEvent({message:'{"token":"hidden-credential","serialNumber":"hidden-device","keymap":{"keys":[1,2,3]}}'});
 assert.ok(!consoleEvent.message.includes('hidden-credential'));assert.ok(!consoleEvent.message.includes('hidden-device'));assert.ok(!consoleEvent.message.includes('[1,2,3]'));
 for(const secret of ['abc.def','ghp_abcdefgh','github_pat_abcdefgh','secret','device-private','private'])assert.ok(!value.includes(secret),secret);
 assert.equal(event.details.nested.phase,'verify');assert.ok(Buffer.byteLength(value)<=4096);assert.match(event.details.stack,/trace/);
});

test('renderer events reject oversized or unexpected payloads before persistence',()=>{
 assert.equal(validateLogEvent({level:'info',component:'device',message:'apply complete',details:{phase:'verify'}}).message,'apply complete');
 for(const value of [null,[],{level:'debug',component:'device',message:'x'},{level:'info',component:'device',message:'x',path:'/tmp/arbitrary'},{level:'info',component:'device',message:'x'.repeat(5000)},{level:'info',component:'device',message:'x',details:[]}])assert.throws(()=>validateLogEvent(value));
 const cycle={};cycle.self=cycle;assert.throws(()=>validateLogEvent({level:'info',component:'device',message:'x',details:cycle}));
});

test('serializes concurrent JSONL entries and retains three bounded rotating files',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'studio-log-'));
 try{
  const logger=createDiagnosticLogger({directory,maxBytes:550});
  await Promise.all(Array.from({length:30},(_,index)=>logger.write({level:'info',component:'test',message:'entry '+index,details:{padding:'x'.repeat(70)}})));
  await logger.flush();
  const files=(await readdir(directory)).sort();assert.deepEqual(files,['studio.1.jsonl','studio.2.jsonl','studio.jsonl']);
  const events=[];
  for(const name of files){assert.ok((await stat(path.join(directory,name))).size<=550);assert.equal((await stat(path.join(directory,name))).mode&0o777,0o600);events.push(...(await readFile(path.join(directory,name),'utf8')).trim().split('\n').map(JSON.parse));}
  assert.ok(events.some(event=>event.message==='entry 29'));assert.ok(events.every(event=>event.timestamp&&event.component==='test'));assert.equal(new Set(events.map(event=>event.message)).size,events.length);
  logger.writeSync({level:'error',component:'process',message:'fatal'});assert.match(await readFile(path.join(directory,'studio.jsonl'),'utf8'),/fatal/);
 }finally{await rm(directory,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CompanionGateway} from '../scripts/companion-api.mjs';

test('packaged gateway uses its bundled executable and external backup directory and waits for shutdown',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'mini-desktop-'));
 const gateway=new CompanionGateway(path.join(root,'app.asar'),{cwd:root,executable:process.execPath,args:[fileURLToPath(new URL('./fixtures/rpc-worker.mjs',import.meta.url))],backupDir:path.join(root,'backups')});
 try{
  assert.equal(gateway.available,true);
  const result=await gateway.call('status');
  assert.equal(result.backupDir,path.join(root,'backups'));
  await gateway.stop();
  assert.equal(gateway.child,null);
 }finally{gateway.child?.kill();await rm(root,{recursive:true,force:true});}
});
test('a timed-out helper shutdown retains ownership and rejects calls until the old process exits',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'mini-shutdown-'));
 const gateway=new CompanionGateway(root,{executable:process.execPath,args:[fileURLToPath(new URL('./fixtures/rpc-worker.mjs',import.meta.url)),'150'],shutdownTimeoutMs:5});
 try{
  await gateway.call('status');const child=gateway.child;
  const exited=new Promise(resolve=>child.once('exit',resolve));
  await assert.rejects(gateway.stop(),/종료/);
  assert.equal(gateway.child,child);
  await assert.rejects(gateway.call('status'),/종료 중/);
  assert.equal(gateway.child,child);
  await exited;assert.equal(gateway.child,null);
 }finally{gateway.child?.kill();await rm(root,{recursive:true,force:true});}
});

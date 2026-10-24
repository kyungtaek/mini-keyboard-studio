import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CatalogAuth,validateCatalogInvocation} from '../desktop/catalog-auth.mjs';
test('credential encryption and status never return tokens; clearing preserves gh login',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'catalog-auth-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const safeStorage={isAsyncEncryptionAvailable:async()=>true,encryptStringAsync:async value=>Buffer.from('encrypted:'+value),decryptStringAsync:async bytes=>({result:bytes.toString().slice(10),shouldReEncrypt:false})};
 const auth=new CatalogAuth({dataDir:dir,safeStorage,ghToken:async()=> 'gh-secret-token-1234567890'});
 assert.equal((await auth.status()).method,'gh');await auth.save('stored-secret-token-1234567890');assert.equal(await auth.getToken(),'stored-secret-token-1234567890');assert.equal(JSON.stringify(await auth.status()).includes('secret'),false);
 assert.ok((await readFile(path.join(dir,'catalog-credential.bin'),'utf8')).startsWith('encrypted:'));await auth.clear();assert.equal((await auth.status()).method,'gh');
 safeStorage.isAsyncEncryptionAvailable=async()=>false;await assert.rejects(auth.save('another-secret-token-12345'),/암호화/);
});
test('catalog IPC only accepts exact command payloads',()=>{
 for(const [cmd,args] of [['list',{}],['download',{id:'sample-vscode-mac'}],['save-token',{token:'valid-secret-token-123456789'}],['auth-status',{}],['clear-token',{}]])assert.doesNotThrow(()=>validateCatalogInvocation(cmd,args));
 for(const [cmd,args] of [['shell',{}],['list',{token:'x'}],['download',{id:'../a'}],['save-token',{token:'bad\nvalue'}],['list',[]]])assert.throws(()=>validateCatalogInvocation(cmd,args));
});

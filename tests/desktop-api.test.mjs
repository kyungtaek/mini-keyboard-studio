import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {createCompanionApi} from '../desktop/local-api.mjs';
test('malformed local API request targets return 400 and do not terminate the server',async()=>{
 let handled=0;
 const server=createCompanionApi({handle:async(_req,res)=>{handled++;res.writeHead(200);res.end('ready');}},4173);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const request=target=>new Promise((resolve,reject)=>{const socket=net.connect(port,'127.0.0.1',()=>socket.end(`GET ${target} HTTP/1.1\r\nHost: localhost:${port}\r\nConnection: close\r\n\r\n`));let data='';socket.on('data',chunk=>data+=chunk);socket.on('error',reject);socket.on('close',()=>resolve(data));});
 try{assert.match(await request('http://['),/^HTTP\/1.1 400/);assert.match(await request('/api/companion'),/^HTTP\/1.1 200/);assert.equal(handled,1);}
 finally{await new Promise(resolve=>server.close(resolve));}
});

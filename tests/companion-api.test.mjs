import test from 'node:test';import assert from 'node:assert/strict';
import {authorizeApi} from '../scripts/companion-api.mjs';
test('companion API requires exact loopback host, same origin, JSON and current session token',()=>{
 const req={method:'POST',headers:{host:'localhost:4173',origin:'http://localhost:4173','content-type':'application/json','x-mini-session':'secret'}};
 assert.doesNotThrow(()=>authorizeApi(req,4173,'secret'));
 for(const headers of [{...req.headers,host:'evil.example:4173'},{...req.headers,origin:'https://evil.example'},{...req.headers,'x-mini-session':'bad'},{...req.headers,'content-type':'text/plain'}])assert.throws(()=>authorizeApi({...req,headers},4173,'secret'));
 assert.doesNotThrow(()=>authorizeApi({method:'GET',headers:{host:'127.0.0.1:4173'}},4173,'secret'));
});

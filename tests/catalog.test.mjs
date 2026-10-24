import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalog} from '../src/catalog.js';
const fixture=JSON.parse(await readFile(new URL('./fixtures/catalog.json',import.meta.url)));
test('catalog accepts current schema and rejects unsafe paths, duplicate ids, hashes and unsupported models',()=>{
 assert.equal(validateCatalog(fixture).entries.length,6);
 for(const patch of [{path:'keymaps/../a.json'},{path:'https://evil/a.json'},{path:'keymaps/a//b.json'},{sha256:'bad'},{modelId:'unknown'}]){
 const value=structuredClone(fixture);Object.assign(value.entries[0],patch);assert.throws(()=>validateCatalog(value));}
 const duplicate=structuredClone(fixture);duplicate.entries.push(duplicate.entries[0]);assert.throws(()=>validateCatalog(duplicate));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile} from '../src/profile.js';
import {keyLightingHTML,updateKeyLighting} from '../src/key-lighting-ui.js';
test('selected key gets one of sixteen colors independently of its shortcut and layer mode',()=>{
 const p=createProfile();p.layers[0].actions[0]={type:'key',keys:['ENTER'],label:'Enter'};
 const next=updateKeyLighting(p,0,1,{color:'#ff0000',mode:1});
 assert.deepEqual(next.layers[0].actions[0],p.layers[0].actions[0]);assert.equal(p.layers[0].lighting,null);
 assert.equal(next.layers[0].lighting.colors[0],'#ff0000');assert.equal(next.layers[0].lighting.colors[1],null);
 assert.equal(next.layers[0].lighting.mode,1);
 assert.equal(updateKeyLighting(next,0,1,{color:null}).layers[0].lighting.colors[0],null);
 assert.throws(()=>updateKeyLighting(p,0,1,{color:'#112233'}),/팔레트/);
});
test('LED UI exposes exactly sixteen preset color buttons, no freeform color input or app binding',()=>{
 const html=keyLightingHTML(createProfile(),0,1);
 assert.equal((html.match(/data-color-index=/g)||[]).length,16);
 assert(!html.includes('type="color"'));assert(!html.includes('applicationId'));
 assert.equal(keyLightingHTML(createProfile(),0,17),'');
});

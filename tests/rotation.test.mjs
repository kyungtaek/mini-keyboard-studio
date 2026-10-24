import test from 'node:test';import assert from 'node:assert/strict';
import {createProfile} from '../src/profile.js';
import {gridActionIds} from '../src/models.js';
import {rotateProfileKeys} from '../src/rotation.js';
function fixture(){const p=createProfile();p.layers.forEach((l,index)=>l.actions=l.actions.map((_,i)=>({type:'key',keys:[String.fromCharCode(65+(i+index)%26)]})));return p;}
test('rotation maps visible positions across all layers and leaves every knob unchanged',()=>{
 const p=fixture(),next=rotateProfileKeys(p,270);const oldGrid=gridActionIds(p.modelId,0).flat(),newGrid=gridActionIds(p.modelId,270).flat();
 for(let l=0;l<3;l++){oldGrid.forEach((id,i)=>assert.deepEqual(next.layers[l].actions[newGrid[i]-1],p.layers[l].actions[id-1]));assert.deepEqual(next.layers[l].actions.slice(16),p.layers[l].actions.slice(16));}
 assert.equal(next.rotation,270);assert.equal(p.rotation,0);assert.deepEqual(rotateProfileKeys(next,0).layers,p.layers);
});
test('four right turns restore original key order; preserve slots require known live actions',()=>{
 const original=fixture();let p=original;for(const r of [90,180,270,0])p=rotateProfileKeys(p,r);assert.deepEqual(p.layers,original.layers);
 const empty=createProfile();assert.throws(()=>rotateProfileKeys(empty,90),/동작/);
 const live=original.layers.map(l=>l.actions);assert.deepEqual(rotateProfileKeys(empty,90,{currentActions:live}).layers[0].actions.slice(16),empty.layers[0].actions.slice(16));
 assert.throws(()=>rotateProfileKeys(fixture(),45),/회전/);
 const rectangular=createProfile('Rect','mini-6x1');assert.throws(()=>rotateProfileKeys(rectangular,90),/배치/);
});

test('explicit key LED colors follow visible key rotation while layer mode stays common',()=>{
 const p=fixture();p.layers[0].lighting={mode:2,colors:Array(16).fill(null)};p.layers[0].lighting.colors[0]='#ff0000';
 const next=rotateProfileKeys(p,270);const index=gridActionIds(p.modelId,0).flat().indexOf(1),destination=gridActionIds(p.modelId,270).flat()[index];
 assert.equal(next.layers[0].lighting.colors[destination-1],'#ff0000');assert.equal(next.layers[0].lighting.mode,2);
 assert.deepEqual(rotateProfileKeys(next,0).layers,p.layers);
});

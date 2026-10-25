import test from 'node:test';import assert from 'node:assert/strict';
import {createProfile} from '../src/profile.js';
import {gridActionIds} from '../src/models.js';
import {rotateProfileKeys} from '../src/rotation.js';
function fixture(){const p=createProfile();p.layers.forEach((l,index)=>l.actions=l.actions.map((_,i)=>({type:'key',keys:[String.fromCharCode(65+(i+index)%26)]})));return p;}
test('keys and functions rotate together rather than cancelling the visible rotation',()=>{
 const p=fixture();
 const expected={0:'ABCDEFGHIJKLMNOP',90:'MIEANJFBOKGCPLHD',180:'PONMLKJIHGFEDCBA',270:'DHLPCGKOBFJNAEIM'};
 for(const angle of [0,90,180,270]){
  const next=rotateProfileKeys(p,angle);
  const visible=gridActionIds(next.modelId,angle).flat().map(id=>next.layers[0].actions[id-1].keys[0]).join('');
  assert.equal(visible,expected[angle]);assert.deepEqual(next.layers,p.layers);assert.equal(next.rotation,angle);
 }
 assert.equal(p.rotation,0);
});
test('four turns restore original orientation, including unknown slots and rectangular models',()=>{
 const original=createProfile();let p=original;for(const r of [90,180,270,0])p=rotateProfileKeys(p,r);
 assert.deepEqual(p,original);assert.throws(()=>rotateProfileKeys(original,45),/회전/);
 const rect=createProfile('Rect','mini-6x1');const rotated=rotateProfileKeys(rect,90);
 assert.equal(rotated.rotation,90);assert.deepEqual(rotated.layers,rect.layers);
});
test('per-key colors and dial assignments stay attached to the same physical controls',()=>{
 const p=fixture();p.layers[0].lighting={mode:2,colors:Array(16).fill(null)};p.layers[0].lighting.colors[0]='#ff0000';
 const next=rotateProfileKeys(p,270);
 assert.deepEqual(next.layers,p.layers);assert.deepEqual(rotateProfileKeys(next,0),p);
});

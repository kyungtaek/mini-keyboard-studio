import test from 'node:test';
import assert from 'node:assert/strict';
import { MiniKeyboard, profileFromBackup } from '../src/device.js';
import { createProfile } from '../src/profile.js';
import { createBackup } from '../src/protocol.js';
class FakeHID extends EventTarget{
 vendorId=0x514c;productId=0x8850;productName='Test board';opened=true;writes=[];failOnce=false;ignoreWrites=false;modelIdentity=[16,3,11];
 layers=Array.from({length:3},(_,l)=>Array.from({length:25},(_,i)=>{const r=new Uint8Array(64);r.set([3,250,i+1,l+1,1,0,1,0,0,4]);return r;}));
 emit(r){const e=new Event('inputreport');e.reportId=3;e.data=new DataView(r.slice(1).buffer);this.dispatchEvent(e);}
 async sendReport(id,p){assert.equal(id,3);assert.equal(p.length,64);this.writes.push([...p]);
  if(p[0]===251)this.emit(Uint8Array.from([3,251,...this.modelIdentity,...Array(59).fill(0)]));
  if(p[0]===250)for(const r of this.layers[p[3]-1])this.emit(r);
  if(p[0]===253&&p[1]!==254){if(this.failOnce){this.failOnce=false;throw Error('USB disconnected once');}if(!this.ignoreWrites){const r=new Uint8Array(64);r[0]=3;r[1]=250;r.set(p.slice(1,50),2);this.layers[r[3]-1][r[2]-1]=r;}}
 }
 async close(){this.opened=false;}
}
test('apply saves complete backup before writes, verifies all records, and does not rewrite preserve slots',async()=>{
 const hid=new FakeHID(),d=new MiniKeyboard(hid);await d.initialize();const p=createProfile();p.layers[1].actions[4]={type:'key',keys:['F13']};
 let saved;const result=await d.apply(p,{persistBackup:async b=>{assert.equal(hid.writes.filter(x=>x[0]===253).length,0);saved=b;}});
 assert.equal(result.changed,1);assert.equal(hid.layers[1][4][9],104);assert.equal(saved.layers.flat().length,75);
 assert.equal(hid.writes.filter(x=>x[0]===253&&x[1]!==254).length,2);
 assert.equal(hid.writes.some(x=>x[0]===252),false);
});
test('backup persistence failure prevents writes',async()=>{
 const h=new FakeHID(),d=new MiniKeyboard(h);await d.initialize();const p=createProfile();p.layers[0].actions[0]={type:'key',keys:['B']};
 await assert.rejects(d.apply(p,{persistBackup:async()=>{throw Error('quota');}}),/quota/);assert.equal(h.writes.some(x=>x[0]===253),false);
});
test('a failed companion transaction aborts instead of releasing an uncertain write as complete',async()=>{
 const hid=new FakeHID(),events=[];
 hid.beginTransaction=async()=>events.push('begin');
 hid.endTransaction=async()=>events.push('end');
 hid.abortTransaction=async()=>events.push('abort');
 const device=new MiniKeyboard(hid);await device.initialize();
 const profile=createProfile();profile.layers[0].actions[0]={type:'key',keys:['B']};
 await assert.rejects(device.apply(profile,{persistBackup:async()=>{throw Error('backup unavailable');}}),/backup unavailable/);
 assert.deepEqual(events,['begin','abort']);
 events.length=0;
 await device.readAll();
 assert.deepEqual(events,['begin','end']);
});
test('readback mismatch is failure and rollback verifies original',async()=>{
 const h=new FakeHID(),d=new MiniKeyboard(h);await d.initialize();h.ignoreWrites=true;const p=createProfile();p.layers[0].actions[0]={type:'key',keys:['B']};
 await assert.rejects(d.apply(p,{persistBackup:async()=>{}}),/복원.*확인/);assert.equal(h.layers[0][0][9],4);
});
test('partial-write failure rolls back touched layer and original error is retained',async()=>{
 const h=new FakeHID(),d=new MiniKeyboard(h);await d.initialize();h.failOnce=true;const p=createProfile();p.layers[0].actions[0]={type:'key',keys:['B']};
 await assert.rejects(d.apply(p,{persistBackup:async()=>{}}),/USB disconnected once.*복원.*확인/);
 assert.equal(h.layers[0][0][9],4);
});
test('restore validates backup before writing, and current device settings can become editable profile',async()=>{
 const h=new FakeHID(),d=new MiniKeyboard(h);await d.initialize();const b=await createBackup(h.layers,[16,3,11]);const p=await profileFromBackup(b,'기기에서 읽음');assert.deepEqual(p.layers[0].actions[0],{type:'key',keys:['A']});
 b.sha256='bad';await assert.rejects(d.restore(b,{persistBackup:async()=>{}}),/해시/);assert.equal(h.writes.some(x=>x[0]===253),false);
});
test('new family devices use their own layout and USB identifiers for backup/apply/restore',async()=>{
 const h=new FakeHID();h.vendorId=0x1189;h.productId=0x8842;h.modelIdentity=[6,2,11];h.layers=h.layers.map(l=>l.slice(0,12));
 const d=new MiniKeyboard(h);await d.initialize();assert.equal(d.modelId,'mini-6x2');
 const p=createProfile('작은 키맵','mini-6x2');p.layers[0].actions[11]={type:'key',keys:['F13']};let backup;
 await d.apply(p,{persistBackup:async b=>{backup=b;}});assert.equal(backup.vid,0x1189);assert.equal(backup.pid,0x8842);assert.equal(backup.layers[0].length,12);
 await d.restore(backup,{persistBackup:async()=>{}});assert.equal(h.layers[0][11][9],4);
 await assert.rejects(d.apply(createProfile(),{persistBackup:async()=>{}}),/모델/);
});

test('media and rollback restore timing and inactive triples on firmware that copies only active entries',async()=>{
 const hid=new FakeHID();const originalSend=hid.sendReport.bind(hid);
 hid.layers[0][18][6]=3;hid.layers[0][18][9]=244;hid.layers[0][18][12]=242;hid.layers[0][18][15]=29;
 hid.layers[1][19][4]=2;hid.layers[1][19][5]=1;hid.layers[1][19][6]=2;
 hid.sendReport=async(id,p)=>{
  if(p[0]!==253||p[1]===254)return originalSend(id,p);
  const r=hid.layers[p[2]-1][p[1]-1].slice();hid.writes.push([...p]);
  r[4]=p[3];if(r[4]===1)r[5]=p[4];r[6]=p[5];r.set(p.slice(6,6+r[6]*3),7);hid.layers[p[2]-1][p[1]-1]=r;
 };
 const d=new MiniKeyboard(hid);await d.initialize();const before=await d.readAll();
 const p=createProfile();p.layers[0].actions[18]={type:'media',key:'VOLUME_UP'};p.layers[1].actions[19]={type:'key',keys:['B']};
 await d.apply(p,{persistBackup:async()=>{}});assert.equal(hid.layers[0][18][15],29);
 await d.restore(before,{persistBackup:async()=>{}});assert.deepEqual((await d.readAll()).layers,before.layers);
});


test('top-knob placement keeps raw IDs and matches independently measured rotated positions',async()=>{
 const hid=new FakeHID(),d=new MiniKeyboard(hid);await d.initialize();
 const original=await d.readAll();const profile=createProfile();profile.rotation=270;
 profile.layers[0].actions=profile.layers[0].actions.map((action,index)=>index<16?{type:'key',keys:[String.fromCharCode(65+index)]}:action);
 await d.apply(profile,{persistBackup:async()=>{}});
 // Physical scan order is measured independently, not assumed raw-row-major.
 const expected=['D','H','L','P','C','G','K','O','B','F','J','N','A','E','I','M'];
 const physicalTopWire=[4,8,12,16,3,7,11,15,2,6,10,14,1,5,9,13];
 assert.deepEqual(physicalTopWire.map(id=>String.fromCharCode(65+hid.layers[0][id-1][9]-4)),expected);
 assert.deepEqual(hid.layers[0].slice(0,16).map(record=>record[9]),Array.from({length:16},(_,i)=>4+i));
 assert.deepEqual(hid.layers[0].map(record=>record[2]),Array.from({length:25},(_,i)=>i+1));
 assert.deepEqual(hid.layers[0].slice(16),original.layers[0].slice(16).map(hex=>Uint8Array.from(hex.match(/../g).map(byte=>parseInt(byte,16)))));
 const backup=await d.readAll(),imported=await profileFromBackup(backup);
 assert.deepEqual(imported.layers[0].actions.slice(0,16),profile.layers[0].actions.slice(0,16));
 const unchanged=await d.apply(imported,{persistBackup:async()=>{throw Error('unchanged profile must not write');}});
 assert.equal(unchanged.changed,0);
 await d.restore(original,{persistBackup:async()=>{}});
 assert.deepEqual((await d.readAll()).layers,original.layers);
});

test('disabled key writes a zero-length keyboard action and leaves other records intact',async()=>{
 const hid=new FakeHID(),device=new MiniKeyboard(hid);await device.initialize();
 const before=await device.readAll(),profile=createProfile();profile.layers[0].actions[0]={type:'disabled'};
 const result=await device.apply(profile,{persistBackup:async()=>{}});
 assert.equal(result.changed,1);assert.equal(hid.layers[0][0][4],1);assert.equal(hid.layers[0][0][6],0);
 assert.deepEqual((await device.readAll()).layers[0].slice(1),before.layers[0].slice(1));
});

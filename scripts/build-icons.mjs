import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const name=Buffer.from(type),body=Buffer.concat([name,data]);let crc=0xffffffff;for(const byte of body)crc=table[(crc^byte)&255]^(crc>>>8);const head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([head,body,tail]);}
function png(size,tray=false){
 const row=size*4+1,data=Buffer.alloc(row*size);
 const rect=(x,y,a,b,c,d,r=0)=>{const dx=Math.max(a+r-x,0,x-(c-r)),dy=Math.max(b+r-y,0,y-(d-r));return x>=a&&x<=c&&y>=b&&y<=d&&dx*dx+dy*dy<=r*r;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5)/size,v=(y+.5)/size;let color=[0,0,0,0];
  if(!tray&&rect(u,v,.025,.025,.975,.975,.2))color=[24,24,24,255];
  for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(rect(u,v,.2+i*.34,.2+j*.34,.46+i*.34,.46+j*.34,.045))color=tray?[0,0,0,255]:i===1&&j===1?[30,215,96,255]:[239,239,239,255];
  for(let k=0;k<4;k++)data[y*row+1+x*4+k]=color[k];
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(data)),chunk('IEND',Buffer.alloc(0))]);
}
await mkdir('desktop/icons/AppIcon.iconset',{recursive:true});
for(const n of [16,32,128,256,512])for(const scale of [1,2])await writeFile(`desktop/icons/AppIcon.iconset/icon_${n}x${n}${scale===2?'@2x':''}.png`,png(n*scale));
await writeFile('desktop/icons/trayTemplate.png',png(16,true));await writeFile('desktop/icons/trayTemplate@2x.png',png(32,true));
execFileSync('iconutil',['-c','icns','desktop/icons/AppIcon.iconset','-o','desktop/icons/app.icns']);

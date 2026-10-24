import {LED_PALETTE} from './lighting-profile.js';
import {validateProfile} from './profile.js';
export function updateKeyLighting(value,layer,id,{color,mode}={}){
 const profile=validateProfile(value);
 if(profile.modelId!=='mini-16x3'||!Number.isInteger(layer)||layer<0||layer>2||!Number.isInteger(id)||id<1||id>16)throw Error('키 LED 설정을 지원하지 않는 위치입니다.');
 const lighting=profile.layers[layer].lighting||{mode:null,colors:Array(16).fill(null)};
 if(color!==undefined)lighting.colors[id-1]=color;
 if(mode!==undefined)lighting.mode=mode;
 profile.layers[layer].lighting=lighting;
 return validateProfile(profile);
}
export function keyLightingHTML(profile,layer,id){
 if(profile.modelId!=='mini-16x3'||id>16)return '';
 const lighting=profile.layers[layer].lighting,color=lighting?.colors[id-1]??null,mode=lighting?.mode??null;
 return `<section class="key-lighting" aria-label="키 LED 설정"><div class="key-lighting-heading"><h3>키 LED</h3><button class="quiet small" data-key-led-color="preserve" aria-pressed="${color===null}" title="장치의 현재 색상 유지">색상 유지</button></div><div class="key-led-palette" role="group" aria-label="LED 16색 팔레트">${LED_PALETTE.map((hex,index)=>`<button type="button" data-key-led-color="${hex}" data-color-index="${index}" class="${color===hex?'selected':''} ${hex==='#000000'?'led-off':''}" aria-label="${hex==='#000000'?'LED 꺼짐':`LED 색상 ${hex}`}" aria-pressed="${color===hex}" title="${hex==='#000000'?'꺼짐':hex}">${hex==='#000000'?'<span aria-hidden="true">⏻</span>':''}</button>`).join('')}</div><label class="key-led-mode"><span>발광 모드 <small>레이어 전체</small></span><select id="key-led-mode" aria-label="레이어 발광 모드"><option value="preserve">현재 모드 유지</option>${Array.from({length:6},(_,index)=>`<option value="${index}" ${mode===index?'selected':''}>모드 ${index}</option>`).join('')}</select></label><p class="key-led-note">모드 효과가 그대로면 USB 케이블 재연결로 확인하세요.</p></section>`;
}

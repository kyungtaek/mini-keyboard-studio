import {loadLibrary,saveToLibrary,validateProfile} from './profile.js';
export async function seedDesktopLibrary({storage=localStorage,fetcher=fetch}={}){
 const marker='mini-keyboard-studio:desktop-samples:v1';
 const existing=loadLibrary(storage);
 if(storage.getItem(marker)==='1')return;
 const indexResponse=await fetcher('./presets/index.json');if(!indexResponse.ok)throw Error('샘플 목록을 불러오지 못했습니다.');
 const index=await indexResponse.json();if(!Array.isArray(index)||index.length>20)throw Error('잘못된 샘플 목록입니다.');
 const profiles=[];
 for(const item of index){if(!/^sample-[a-z0-9-]+\.json$/.test(item.file))throw Error('잘못된 샘플 파일입니다.');const response=await fetcher('./presets/'+item.file);if(!response.ok)throw Error('샘플을 불러오지 못했습니다.');profiles.push(validateProfile(await response.json()));}
 for(const profile of profiles.reverse())if(!existing.some(item=>item.id===profile.id))saveToLibrary(profile,storage);
 storage.setItem(marker,'1');
}

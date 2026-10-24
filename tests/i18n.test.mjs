import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,MESSAGES,LANGUAGE_STORAGE_KEY,normalizeLocale,detectLocale,browserLanguage,translate,escapeLocalizedHTML,createDOMLocalizer,createLanguageController} from '../src/i18n.js';

test('all six locales have complete, nonblank real translations and matching placeholders',()=>{
 const keys=Object.keys(MESSAGES.ko).sort();assert(keys.length>=490);
 for(const locale of SUPPORTED_LOCALES){assert.deepEqual(Object.keys(MESSAGES[locale]).sort(),keys);for(const key of keys){const value=MESSAGES[locale][key];assert.equal(typeof value,'string',`${locale}: ${key}`);assert(value.trim());const slots=text=>[...text.matchAll(/\{(\d+)!?\}/g)].map(m=>m[1]).sort();assert.deepEqual(slots(value),slots(key),`${locale}: ${key}`);if(locale!=='ko')assert(!/[가-힣]/.test(value),`${locale} must not fall back to Korean: ${key}`);}}
 for(const key of ['내 키맵','동작 편집','파일·공유','키 입력 진단','장치 관리','LED 직접 설정','키맵 카탈로그','언어'])for(const locale of ['ja','es','zh-CN','zh-TW'])assert.notEqual(translate(key,locale),translate(key,'en'));
});
test('locale detection handles regional/script variants and unsupported system locales',()=>{
 for(const [input,want] of [['en_GB','en'],['ko-KR','ko'],['ja-JP','ja'],['es-MX','es'],['zh-Hans','zh-CN'],['zh-Hant','zh-TW'],['zh-HK','zh-TW'],['zh-SG','zh-CN'],['fr-FR','en'],[undefined,'en']])assert.equal(normalizeLocale(input),want);
 assert.equal(detectLocale(['fr-FR','es-AR']),'es');assert.equal(detectLocale([]),'en');assert.equal(detectLocale('ja-JP'),'ja');
 assert.equal(browserLanguage({getItem:()=> 'zh-TW'},{languages:['ko-KR']}),'zh-TW');assert.equal(browserLanguage({getItem(){throw Error('Denied')}},{languages:['es']}),'es');
});
test('desktop language is authoritative; native changes and persistence use the contract',async()=>{
 let callback,disposed=false;const calls=[];const updates=[];
 const controller=await createLanguageController({desktop:{getLanguage:async()=> 'ja',setLanguage:async locale=>{calls.push(locale);return locale},onLanguage:cb=>{callback=cb;return()=>disposed=true}},storage:{getItem(){throw Error('Native must not read browser preferences')},setItem(){throw Error('Native must not write browser preferences')}},onChange:locale=>updates.push(locale)});
 assert.equal(controller.locale,'ja');await controller.setLocale('es');assert.deepEqual(calls,['es']);callback('zh-TW');assert.equal(controller.locale,'zh-TW');assert.deepEqual(updates,['ja','es','zh-TW']);controller.dispose();assert(disposed);
});
test('browser language preference persists and failed writes preserve the previous selection',async()=>{
 const values=new Map();let denied=false;const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(denied)throw Error('Denied');values.set(key,value)}};
 const controller=await createLanguageController({desktop:null,storage,navigator:{languages:['es-MX']}});assert.equal(controller.locale,'es');await controller.setLocale('zh-CN');assert.equal(values.get(LANGUAGE_STORAGE_KEY),'zh-CN');denied=true;await assert.rejects(controller.setLocale('ja'));assert.equal(controller.locale,'zh-CN');
 const reopened=await createLanguageController({desktop:null,storage,navigator:{languages:['ko']}});assert.equal(reopened.locale,'zh-CN');await assert.rejects(reopened.setLocale('fr'));
});
test('dynamic messages localize chrome but preserve arbitrary captures, chords and markup as text',()=>{
 const user='<img src=x onerror=alert(1)> 저장';
 assert.equal(translate(user+' 다운로드 중…','en'),`Downloading ${user}…`);assert.equal(translate('레이어 3 / 다이얼 2 · 누르기','en'),'Layer 3 / Dial 2 · Press');
 assert.equal(translate('1행 2열 (화면 K4 / USB 3)','en'),'Row 1, column 2 (screen K4 / USB 3)');assert.equal(translate('1행 2열 X화면 K4 / USB 3Y','en'),'1행 2열 X화면 K4 / USB 3Y');
 assert.equal(translate('GitHub 요청 실패 (403). 저장소 접근 권한을 확인하세요.','en'),'GitHub request failed (403). Check repository access.');
 assert.equal(translate('키 2: 사용자 지정 이름 CTRL+C','en'),'Key 2: 사용자 지정 이름 CTRL+C');assert.equal(translate('레이어 2','ko'),'레이어 2');assert.equal(escapeLocalizedHTML(user),'&lt;img src=x onerror=alert(1)&gt; 저장');
});

// Small DOM fixture exercises the actual localizer without a browser or HID API.
class Text {constructor(data){this.nodeType=3;this.data=data;this.childNodes=[];}}
class Element {
 constructor(tag='div',attrs={},children=[]){this.nodeType=1;this.tagName=tag;this.attrs={...attrs};this.childNodes=[];this.value='';for(const child of children)this.append(typeof child==='string'?new Text(child):child);}
 append(child){child.parentElement=this;child.ownerDocument=this.ownerDocument;this.childNodes.push(child);}
 getAttribute(name){return this.attrs[name]??null}setAttribute(name,value){this.attrs[name]=value}
 matches(selector){return selector.split(',').some(part=>{part=part.trim();if(part.startsWith('['))return Object.hasOwn(this.attrs,part.slice(1,-1).split('=')[0]);if(part.startsWith('#'))return this.attrs.id===part.slice(1);if(part.startsWith('.'))return (this.attrs.class||'').split(' ').includes(part.slice(1));return this.tagName===part;});}
 closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
}
let observer;
class Observer {constructor(callback){this.callback=callback;this.disconnects=0;this.observes=0;observer=this}disconnect(){this.disconnects++}observe(){this.observes++}}
test('DOM localization switches back to source, retranslates dynamic renders, preserves user data and cannot loop',()=>{
 const title=new Element('h2',{},['내 키맵']),dynamic=new Element('p',{title:'장치 연결 전'},['레이어 1']);
 const name=new Element('strong',{'data-i18n-preserve':''},['저장']),label=new Element('span',{class:'keycap-label','data-i18n-preserve':''},['복사']);
 const input=new Element('input',{placeholder:'이름, 앱, 태그 검색'});input.value='내 키맵 <script> CTRL+C';const code=new Element('code',{},['{"name":"저장"}']);
 const root=new Element('body',{},[title,dynamic,name,label,input,code]);root.ownerDocument={documentElement:{lang:'ko'}};
 const localizer=createDOMLocalizer(root,'en',{Observer});assert.equal(title.childNodes[0].data,'My keymaps');assert.equal(dynamic.childNodes[0].data,'Layer 1');assert.equal(dynamic.getAttribute('title'),'No device connected');assert.equal(name.childNodes[0].data,'저장');assert.equal(label.childNodes[0].data,'복사');assert.equal(input.value,'내 키맵 <script> CTRL+C');assert.equal(code.childNodes[0].data,'{"name":"저장"}');
 localizer.setLocale('ja');assert.equal(title.childNodes[0].data,'マイキーマップ');dynamic.childNodes[0].data='레이어 3';observer.callback();assert.equal(dynamic.childNodes[0].data,'レイヤー 3');
 const late=new Element('button',{},['측정 시작']);root.append(late);observer.callback();assert.equal(late.childNodes[0].data,'測定を開始');
 localizer.setLocale('ko');assert.equal(title.childNodes[0].data,'내 키맵');assert.equal(dynamic.childNodes[0].data,'레이어 3');assert.equal(dynamic.getAttribute('title'),'장치 연결 전');assert.equal(late.childNodes[0].data,'측정 시작');assert.equal(root.ownerDocument.documentElement.lang,'ko');
 assert.equal(observer.observes,observer.disconnects);const before=observer.observes;localizer.dispose();observer.callback();assert.equal(observer.observes,before);
});


test('built-in-derived board/current labels and default media localize; custom labels stay literal',()=>{
 const derived=new Element('span',{class:'keycap-function'},['줄 위로 이동']);
 const custom=new Element('span',{class:'keycap-function','data-i18n-preserve':''},['줄 위로 이동']);
 const currentDerived=new Element('strong',{},['줄 위로 이동']);
 const currentCustom=new Element('strong',{'data-i18n-preserve':''},['저장']);
 const current=new Element('div',{class:'function-current'},[currentDerived,currentCustom,new Element('span',{},['재생 / 일시 정지'])]);
 const media=new Element('span',{class:'keycap-label'},['음소거']),chord=new Element('span',{class:'keycap-label'},['⌃ C']);
 const root=new Element('body',{},[derived,custom,current,media,chord]);root.ownerDocument={documentElement:{lang:'ko'}};
 const localizer=createDOMLocalizer(root,'en',{Observer});
 assert.equal(derived.childNodes[0].data,'Move line up');assert.equal(currentDerived.childNodes[0].data,'Move line up');assert.equal(custom.childNodes[0].data,'줄 위로 이동');assert.equal(currentCustom.childNodes[0].data,'저장');assert.equal(current.childNodes[2].childNodes[0].data,'Play / pause');assert.equal(media.childNodes[0].data,'Mute');assert.equal(chord.childNodes[0].data,'⌃ C');
 localizer.setLocale('ja');assert.equal(derived.childNodes[0].data,'行を上へ移動');assert.equal(custom.childNodes[0].data,'줄 위로 이동');
 localizer.setLocale('ko');assert.equal(derived.childNodes[0].data,'줄 위로 이동');assert.equal(media.childNodes[0].data,'음소거');localizer.dispose();
});

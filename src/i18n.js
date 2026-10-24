import { MESSAGE_ROWS } from './locales/messages.js';
import { STATUS_ROWS } from './locales/status.js';
import { ERROR_ROWS } from './locales/errors.js';
import { FUNCTION_ROWS } from './locales/functions.js';

export const SUPPORTED_LOCALES = Object.freeze(['en','ko','ja','es','zh-CN','zh-TW']);
export const LANGUAGE_NAMES = Object.freeze({en:'English',ko:'한국어',ja:'日本語',es:'Español','zh-CN':'简体中文','zh-TW':'繁體中文'});
export const LANGUAGE_STORAGE_KEY = 'mini-keyboard-studio:language:v1';
const columns = ['ko','en','ja','es','zh-CN','zh-TW'];
const allRows = [...MESSAGE_ROWS, ...STATUS_ROWS, ...ERROR_ROWS, ...FUNCTION_ROWS];
export const MESSAGES = Object.freeze(Object.fromEntries(SUPPORTED_LOCALES.map(locale => [locale, Object.freeze(Object.fromEntries(allRows.map(row => [row[0], locale === 'ko' ? row[0] : row[columns.indexOf(locale)]])))])));
const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = [...new Set(allRows.map(row => row[0]))].filter(source => /\{\d+\}/.test(source)).sort((a,b) => b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(source => {
  const slots = [];
  let expression = '', offset = 0;
  for (const match of source.matchAll(/\{(\d+)\}/g)) {
    expression += escapePattern(source.slice(offset,match.index)) + '(.*?)';
    slots.push(match[1]); offset = match.index + match[0].length;
  }
  expression += escapePattern(source.slice(offset));
  return {source, slots, regex:new RegExp(`^${expression}$`,'s')};
});

export function normalizeLocale(value, fallback = 'en') {
  if (typeof value !== 'string') return fallback;
  const language = value.trim().replaceAll('_','-').toLowerCase();
  if (/^zh(?:-|$)/.test(language)) return /(?:^|-)(?:tw|hk|mo|hant)(?:-|$)/.test(language) ? 'zh-TW' : 'zh-CN';
  const base = language.split('-')[0];
  return ['en','ko','ja','es'].includes(base) ? base : fallback;
}
export function detectLocale(languages = []) {
  for (const language of typeof languages === 'string' ? [languages] : languages) {
    const locale = normalizeLocale(language,null);
    if (locale) return locale;
  }
  return 'en';
}
export function browserLanguage(storage, navigator = globalThis.navigator) {
  try { const target=storage===undefined?globalThis.localStorage:storage; const stored=target?.getItem(LANGUAGE_STORAGE_KEY); if(SUPPORTED_LOCALES.includes(stored))return stored; } catch {}
  return detectLocale(navigator?.languages?.length ? navigator.languages : [navigator?.language]);
}

// Translation values are always plain text. Captures such as names, key chords,
// JSON and remote errors are never interpreted as markup or translated implicitly.
export function translate(value, locale = 'en', depth = 0) {
  const text = String(value ?? '');
  if (locale === 'ko' || depth > 6) return text;
  const dictionary = MESSAGES[normalizeLocale(locale)];
  const trimmed = text.trim();
  if (!trimmed) return text;
  let result = dictionary[trimmed];
  if (result === undefined) {
    for (const pattern of patterns) {
      const match = pattern.regex.exec(trimmed);
      if (!match) continue;
      const captures = Object.fromEntries(pattern.slots.map((slot,index) => [slot,match[index+1]]));
      result = dictionary[pattern.source].replace(/\{(\d+)(!)?\}/g,(_,slot,localize) => localize ? translate(captures[slot],locale,depth+1) : captures[slot]);
      break;
    }
  }
  if (result === undefined) return text;
  return text.slice(0,text.indexOf(trimmed)) + result + text.slice(text.indexOf(trimmed)+trimmed.length);
}
export function escapeLocalizedHTML(value) { return String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }

// Source caches make English -> Japanese -> Korean reversible, including text
// that was generated after startup. Values/JSON/chords are never visited.
export const PRESERVE_SELECTOR = '[data-i18n-preserve],script,style,code,kbd,textarea,[contenteditable="true"],#file-profile-name,.library-text > span,#debug-history,#debug-raw,#debug-grid button span,.catalog-card h3,.catalog-card p,.function-setup';
export function createDOMLocalizer(root, initialLocale = 'en', {Observer = globalThis.MutationObserver} = {}) {
  let locale = normalizeLocale(initialLocale), disposed = false;
  const textSources = new WeakMap(), attributeSources = new WeakMap();
  const attributes = ['title','aria-label','placeholder','alt'];
  const protectedNode = node => Boolean(node?.closest?.(PRESERVE_SELECTOR));
  function sourceValue(cache,node,current) {
    const previous=cache.get(node);
    return previous && previous.rendered===current ? previous.source : current;
  }
  function visit(node) {
    if (node.nodeType === 3) {
      if (protectedNode(node.parentElement)) return;
      const source=sourceValue(textSources,node,node.data), rendered=translate(source,locale);
      if(node.data!==rendered)node.data=rendered;
      textSources.set(node,{source,rendered});
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
    if(node.nodeType===1 && protectedNode(node))return;
    if(node.nodeType===1){
      const cache=attributeSources.get(node)||new Map();
      for(const name of attributes){
        // A saved profile's title is its literal name; a key tooltip includes
        // arbitrary action labels. Preserve those while translating chrome.
        if(name==='title' && node.matches?.('.library-open,[data-key],.function-option'))continue;
        const current=node.getAttribute(name);if(current===null)continue;
        const previous=cache.get(name), source=previous&&previous.rendered===current?previous.source:current;
        const rendered=translate(source,locale);
        if(current!==rendered)node.setAttribute(name,rendered);
        cache.set(name,{source,rendered});
      }
      attributeSources.set(node,cache);
    }
    for(const child of node.childNodes||[])visit(child);
  }
  const observer=Observer ? new Observer(()=>refresh()) : null;
  function refresh(){
    if(disposed)return;
    observer?.disconnect();
    try{visit(root);}finally{observer?.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});}
  }
  function setLocale(next){locale=normalizeLocale(next);const document=root.ownerDocument||root;if(document.documentElement)document.documentElement.lang=locale;refresh();}
  setLocale(locale);
  return {refresh,setLocale,get locale(){return locale;},dispose(){disposed=true;observer?.disconnect();}};
}

export async function createLanguageController({desktop=globalThis.miniKeyboardDesktop,storage,navigator=globalThis.navigator,onChange=()=>{}}={}) {
  // Do not read browser preferences when native settings are available.
  let locale;
  const native=typeof desktop?.getLanguage==='function'&&typeof desktop?.setLanguage==='function';
  if(native){try{locale=normalizeLocale(await desktop.getLanguage());}catch{locale=detectLocale(navigator?.languages||[navigator?.language]);}}
  else{let target=storage;try{if(target===undefined)target=globalThis.localStorage;}catch{}locale=browserLanguage(target,navigator);storage=target;}
  const update=next=>{locale=normalizeLocale(next);onChange(locale);return locale;};
  const unsubscribe=native?desktop.onLanguage?.(next=>update(next)):null;
  update(locale);
  return {get locale(){return locale;},async setLocale(next){
    if(!SUPPORTED_LOCALES.includes(next))throw new Error('Unsupported language');
    if(native)return update(await desktop.setLanguage(next));
    // Persistence failure leaves the currently selected language unchanged.
    storage?.setItem(LANGUAGE_STORAGE_KEY,next);return update(next);
  },dispose(){if(typeof unsubscribe==='function')unsubscribe();}};
}

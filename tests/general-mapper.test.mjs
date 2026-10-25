import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {APPLICATIONS,loadShortcutCatalog} from '../src/shortcuts.js';import {controlIcon} from '../src/control-icons.js';
const fetcher=async url=>new Response(await readFile(new URL(url),'utf8'));
test('Codex runtime, HUD and exposed IPC are absent from the shipped entry points',async()=>{
 for(const file of ['desktop/main.mjs','desktop/preload.cjs','src/app.js'])assert.doesNotMatch(await readFile(new URL('../'+file,import.meta.url),'utf8'),/mini:codex|CodexController|initCodexPanel|createCodexHUD|globalShortcut/);
 assert.ok(!APPLICATIONS.some(a=>a.id==='codex-mac'));
 const presets=JSON.parse(await readFile(new URL('../presets/index.json',import.meta.url)));assert.ok(presets.every(p=>!p.file.includes('codex')));
});
test('four new Mac app catalogs contain sourced selectable shortcuts',async()=>{
 for(const id of ['slack-mac','google-meet-mac','cmux-mac','chrome-mac']){const c=await loadShortcutCatalog(id,{fetcher});const items=c.groups.flatMap(g=>g.items);assert.ok(items.length>=10);assert.ok(items.every(i=>i.status==='published-default'&&i.sourceUrl&&!i.warning));}
 const meet=await loadShortcutCatalog('google-meet-mac',{fetcher});assert.deepEqual(meet.groups.flatMap(g=>g.items).find(i=>i.label==='마이크 켜기 / 끄기').action.keys,['META','D']);
});
test('control glyphs use consistent decorative SVG geometry and explicit bounds',()=>{
 for(const name of ['chevron-down','rotate-left','rotate-right','reset','knob-left','knob-right','power']){const svg=controlIcon(name,{size:14});assert.match(svg,/viewBox="0 0 24 24"/);assert.match(svg,/aria-hidden="true"/);assert.match(svg,/stroke="currentColor"/);assert.doesNotMatch(svg,/[↶↷⏻]/);}
 assert.throws(()=>controlIcon('unknown'));assert.throws(()=>controlIcon('power',{size:0}));
});

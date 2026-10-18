import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = '/Users/yo/.buzz/REPOS/bitpopart--nostrpop/dist';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SPA_PORT = 8899;
const CDP_PORT = 9444;

const types = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.webmanifest':'application/manifest+json','.xml':'application/xml','.ico':'image/x-icon','.jpg':'image/jpeg','.mp3':'audio/mpeg' };

// 1) SPA server
const server = http.createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(req.url.split('?')[0]));
    if (p === '/') p = '/index.html';
    let file;
    try { file = await readFile(join(ROOT, p)); }
    catch { file = await readFile(join(ROOT, 'index.html')); }
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(file);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(r => server.listen(SPA_PORT, r));

// 2) Chrome headless + CDP
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port='+CDP_PORT,'--user-data-dir=/tmp/home-cdp','--no-default-browser-check','about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent('http://127.0.0.1:8899/')}`, { method: 'PUT' }); tab = await r.json(); break; }
  catch { await sleep(500); }
}
if (!tab) throw new Error('chrome cdP not up');

const { default: WS } = await import('ws');
const ws = new WS(tab.webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));
let id = 0; const pending = new Map(); const consoleErrors = [];
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') consoleErrors.push(msg.params.args.map(a => a.value || a.description || '').join(' '));
  if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
});
const send = (method, params = {}) => new Promise(resolve => { const mid = ++id; pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await sleep(16000);

const evalJs = async (expr) => {
  const out = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return out.result?.result?.value;
};

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : '')); };

// A) default (grid) view — pinned tiles at top of content
const a = await evalJs(`(() => {
  const blocks = [...document.querySelectorAll('div.mb-16')];
  const first = blocks[0];
  const tileImgs = first ? first.querySelectorAll('img').length : 0;
  const tileLinks = first ? [...first.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(Boolean) : [];
  const isTileGrid = first && first.querySelector('.grid.grid-cols-3') !== null;
  return { blocks: blocks.length, tileImgs, tileLinksSample: tileLinks.slice(0, 4), isTileGrid, bodyHead: document.body.innerText.slice(0, 120) };
})()`);
check('A1: first content block is the tile grid (default/grid view)', !!a.isTileGrid && a.tileImgs > 0, JSON.stringify(a).slice(0, 220));
check('A2: 28 tiles expected on live settings', a.tileImgs >= 24, 'img count=' + a.tileImgs);

// B) switch to Gallery and confirm tiles STILL first, sections after
await evalJs(`(() => {
  const s = [...document.querySelectorAll('span')].find(x => x.textContent === 'Gallery');
  const el = s ? s.closest('a,button') || s.parentElement : null;
  if (el) el.click();
  return !!el;
})()`);
await sleep(3000);
const b = await evalJs(`(() => {
  const blocks = [...document.querySelectorAll('div.mb-16')];
  const first = blocks[0];
  const tileImgs = first ? first.querySelectorAll('img').length : 0;
  const isTileGrid = first && first.querySelector('.grid.grid-cols-3') !== null;
  const sectionsBelow = blocks.slice(1).length;
  const body = document.body.innerText;
  return { isTileGrid, tileImgs, sectionsBelow, hasSections: body.includes('Nostr News') || body.includes('Cards'), firstBlockClass: first ? first.className.slice(0, 40) : 'none' };
})()`);
check('B1: tiles stay first after switching to Gallery', !!b.isTileGrid && b.tileImgs > 0, JSON.stringify(b).slice(0, 220));
check('B2: sections render below the tiles', b.hasSections && b.sectionsBelow >= 1, 'blocks below=' + b.sectionsBelow);

// C) console errors
check('C: zero console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | ').slice(0, 300) || 'none');

// D) admin bundle contains the upload button string + new copy
const adminJs = await fetch('http://127.0.0.1:8899/assets/index-' + (await (await fetch('http://127.0.0.1:8899/')).text().then(t => (t.match(/index-([A-Za-z0-9_-]+)\.js/) || [])[1])) + '.js').then(r => r.text()).catch(() => '');
check('D1: admin has Upload button text', adminJs.includes('>Upload</span>') || adminJs.includes('Upload your own image'), 'bundle ' + adminJs.length + ' bytes');

console.log('\nSUMMARY: ' + results.filter(r => r.ok).length + '/' + results.length + ' checks passed');
chrome.kill(); server.close(); process.exit(results.every(r => r.ok) ? 0 : 1);

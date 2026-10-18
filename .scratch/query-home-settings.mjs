import { SimplePool } from 'nostr-tools';
const relays = ['wss://relay.ditto.pub', 'wss://relay.primal.net', 'wss://relay.nostr.net'];
const author = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';
let newest = null;
for (const r of relays) {
  const pool = new SimplePool();
  try {
    const evs = await pool.querySync([r], { kinds: [30078], authors: [author], '#d': ['com.bitpopart.homepage-settings'], limit: 2 }, { maxWait: 5000 });
    for (const ev of evs) if (!newest || ev.created_at > newest.created_at) newest = ev;
  } catch (e) { console.log(r, 'err:', e.message); }
  try { pool.close(); } catch {}
}
if (!newest) { console.log('NO EVENT FOUND'); process.exit(0); }
const c = JSON.parse(newest.content);
console.log('created_at:', new Date(newest.created_at*1000).toISOString());
console.log('defaultView:', c.defaultView);
console.log('gridTiles:', Array.isArray(c.gridTiles) ? `${c.gridTiles.length} tiles` : 'absent');
if (Array.isArray(c.gridTiles) && c.gridTiles.length) console.log('tile links:', c.gridTiles.map(t=>t.linkUrl).join(' | '));
console.log('sections enabled:', (c.sections||[]).filter(s=>s.enabled).map(s=>s.id).join(', ') || '(none)');
process.exit(0);

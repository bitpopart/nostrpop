// POPART.love stock API.
// GET  /api/stock  public: current status and copies left per card.
// PUT  /api/stock  admin only: needs a NIP-98 signed Nostr event from ADMIN_PUBKEY.
// GET/PUT /api/events and /api/event-image: PopUp events and their thumbnails (PUT is admin only).
// GET/PUT /api/catalog?kind=stickers|prints: stickers and prints lists (PUT is admin only).
// GET/PUT /api/file?id=: free download files (PUT is admin only, up to 20 MB). Lists live in /api/catalog?kind=free.
// POST /api/dl-codes (admin) and GET /api/download?code= (public): paid digital files with download codes.
// Everything else is served from the static site (assets).
import { verifyEvent } from "nostr-tools/pure";

const KEY = "stock";
const attempts = new Map();
const STATUSES = ["available", "sold-out", "coming-soon"];
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

async function sha256hex(data) {
  const buf = await crypto.subtle.digest("SHA-256", typeof data === "string" ? new TextEncoder().encode(data) : data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function isAdmin(request, env, body) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Nostr ")) return false;
  let ev;
  try {
    ev = JSON.parse(atob(header.slice(6)));
  } catch {
    return false;
  }
  if (!ev || ev.kind !== 27235 || ev.pubkey !== env.ADMIN_PUBKEY) return false;
  if (Math.abs(Date.now() / 1000 - ev.created_at) > 60) return false;
  const tag = (n) => (ev.tags || []).find((t) => t[0] === n)?.[1];
  const url = new URL(request.url);
  if (tag("method") !== request.method) return false;
  if (tag("u") !== url.origin + url.pathname) return false;
  if (tag("payload") !== (await sha256hex(body))) return false;
  try {
    return verifyEvent(ev) === true;
  } catch {
    return false;
  }
}

// Per-copy code: first 40 bits of HMAC-SHA256(CODE_SECRET, "<card>:<serial>") as 8 letters/digits, same as the Card Maker.
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
async function copyCode(secret, file, serial) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(file + ":" + serial)));
  let bits = 0, acc = 0, out = "";
  for (let i = 0; i < 5; i++) {
    acc = (acc << 8) | h[i]; bits += 8;
    while (bits >= 5) { bits -= 5; out += CODE_ABC[(acc >> bits) & 31]; }
    acc &= (1 << bits) - 1;
  }
  return out;
}

// Holder number: 5 digits from HMAC-SHA256(CODE_SECRET, "holder:<card>:<serial>"), printed only on the certificate and mount card.
async function holderNo(secret, file, serial) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("holder:" + file + ":" + serial)));
  return String((((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0) % 100000).padStart(5, "0");
}


// ---- PopUp events -------------------------------------------------------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function str(v, max) {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string" || v.length > max) return null;
  return v.trim();
}
function httpsUrl(v) {
  const s = str(v, 300);
  if (s === null) return null;
  if (s === "") return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
function cleanEvents(input) {
  if (!Array.isArray(input) || input.length > 200) return null;
  const seen = new Set();
  const out = [];
  for (const e of input) {
    if (!e || typeof e !== "object" || !/^[a-z0-9-]{1,40}$/.test(e.id || "") || seen.has(e.id)) return null;
    seen.add(e.id);
    const title = str(e.title, 120), time = str(e.time, 60), location = str(e.location, 160), description = str(e.description, 1200), url = httpsUrl(e.url);
    if (title === null || !title || time === null || location === null || description === null || url === null) return null;
    if (typeof e.date !== "string" || !DATE_RE.test(e.date) || Number.isNaN(Date.parse(e.date))) return null;
    const imv = Number.isInteger(e.imv) && e.imv > 0 ? e.imv : 0;
    out.push({ id: e.id, title, date: e.date, time, location, description, url, past: e.past === true, image: e.image === true, imv });
  }
  return out;
}

const MAX_FILE = 20 * 1024 * 1024;
function cleanCatalog(input) {
  if (!Array.isArray(input) || input.length > 200) return null;
  const seen = new Set();
  const out = [];
  for (const e of input) {
    if (!e || typeof e !== "object" || !/^[a-z0-9-]{1,40}$/.test(e.id || "") || seen.has(e.id)) return null;
    seen.add(e.id);
    const title = str(e.title, 120), price = str(e.price, 40), description = str(e.description, 1200), url = httpsUrl(e.url);
    if (title === null || !title || price === null || description === null || url === null) return null;
    if (e.status !== "available" && e.status !== "coming-soon") return null;
    const imv = Number.isInteger(e.imv) && e.imv > 0 ? e.imv : 0;
    const category = str(e.category, 40), fname = str(e.fname, 120), ftype = str(e.ftype, 100);
    if (category === null || fname === null || ftype === null) return null;
    const size = Number.isInteger(e.size) && e.size >= 0 && e.size <= MAX_FILE ? e.size : 0;
    const digital = e.digital === "free" || e.digital === "paid" ? e.digital : "";
    out.push({ id: e.id, title, price, description, url, status: e.status, image: e.image === true, imv, category, file: e.file === true, fname, ftype, size, digital });
  }
  return out;
}

// find a downloadable item. publicOnly: free-list items and items marked "free" digital; otherwise any with a file
async function findItem(env, id, publicOnly) {
  for (const kind of ["free", "stickers", "prints"]) {
    const items = (await env.CARDS_KV.get("catalog:" + kind, "json")) || [];
    const item = items.find((e) => e.id === id && e.file);
    if (item && (!publicOnly || kind === "free" || item.digital === "free")) return item;
  }
  return null;
}
function fileResponse(data, item, cache) {
  const name = (item.fname || "download").replace(/[^A-Za-z0-9._ -]/g, "_");
  return new Response(data, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${name}"`,
      "x-content-type-options": "nosniff",
      "access-control-expose-headers": "content-disposition",
      "cache-control": cache,
    },
  });
}
function makeDlCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => CODE_ABC[b & 31]).join("");
}

const SERIAL_LIST = /^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/;
function serialListOk(str) {
  if (str === "" || str === undefined || str === null) return true;
  if (typeof str !== "string" || str.length > 600 || !SERIAL_LIST.test(str)) return false;
  return str.split(",").every((part) => {
    const [lo, hi = lo] = part.split("-").map((x) => Number(x.trim()));
    return lo >= 1 && hi >= lo && hi <= 100000;
  });
}
function serialInList(str, n) {
  if (!str) return false;
  return str.split(",").some((part) => {
    const [lo, hi = lo] = part.split("-").map((x) => Number(x.trim()));
    return n >= lo && n <= hi;
  });
}
function runOf(card) {
  const m = /\d+/.exec(card.run || "");
  return m ? Number(m[0]) : null;
}

function clean(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out = {};
  const registry = {};
  for (const [k, v] of Object.entries(input)) {
    if (!/^[a-z0-9-]{1,60}$/.test(k) || !v || typeof v !== "object") return null;
    if (!STATUSES.includes(v.status)) return null;
    let left = null;
    if (v.left !== null && v.left !== undefined && v.left !== "") {
      left = Number(v.left);
      if (!Number.isInteger(left) || left < 0 || left > 100000) return null;
    }
    const online = v.online === undefined ? true : v.online;
    const offline = v.offline === undefined ? true : v.offline;
    if (typeof online !== "boolean" || typeof offline !== "boolean") return null;
    let link = "";
    if (v.url !== undefined && v.url !== null && v.url !== "") {
      if (typeof v.url !== "string" || v.url.length > 300) return null;
      try {
        const u = new URL(v.url);
        if (u.protocol !== "https:") return null;
        link = u.href;
      } catch {
        return null;
      }
    }
    if (!serialListOk(v.sold)) return null;
    out[k] = { status: v.status, left, online, offline, url: link };
    registry[k] = (v.sold || "").trim();
  }
  return { stock: out, registry };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/registry") {
      // admin only: the list of sold serials per card
      if (request.method !== "GET") return json({ error: "method not allowed" }, 405, { allow: "GET" });
      if (!(await isAdmin(request, env, ""))) return json({ error: "not allowed" }, 401);
      return json((await env.CARDS_KV.get("registry", "json")) || {});
    }
    if (url.pathname === "/api/verify") {
      // public: look a card code up on its own. No serial needed, the code identifies card and copy.
      if (request.method !== "GET") return json({ error: "method not allowed" }, 405, { allow: "GET" });
      if (!env.CODE_SECRET) return json({ error: "codes are not set up yet" }, 503);
      const ip = request.headers.get("cf-connecting-ip") || "x";
      const now = Date.now();
      const slot = attempts.get(ip) || { n: 0, reset: now + 60000 };
      if (now > slot.reset) { slot.n = 0; slot.reset = now + 60000; }
      slot.n++;
      attempts.set(ip, slot);
      if (attempts.size > 5000) attempts.clear();
      if (slot.n > 10) return json({ error: "too many tries, wait a minute" }, 429);
      const given = (url.searchParams.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (given.length !== 8) return json({ valid: false });
      const cards = await (await env.ASSETS.fetch(new URL("/assets/cards.json", request.url))).json();
      let hit = null;
      for (const card of cards) {
        const run = runOf(card);
        if (run === null || run > 1000) continue;
        for (let serial = 1; serial <= run && !hit; serial++) {
          if ((await copyCode(env.CODE_SECRET, card.file, serial)) === given) hit = { card, serial, run };
        }
        if (hit) break;
      }
      if (!hit) return json({ valid: false });
      const key = given;
      const checks = (await env.CARDS_KV.get("checks", "json")) || {};
      const prev = checks[key] || { n: 0, first: now };
      checks[key] = { n: prev.n + 1, first: prev.first };
      await env.CARDS_KV.put("checks", JSON.stringify(checks));
      const registry = (await env.CARDS_KV.get("registry", "json")) || {};
      const holder = (url.searchParams.get("holder") || "").replace(/\D/g, "");
      const holderOk = holder ? holder === (await holderNo(env.CODE_SECRET, hit.card.file, hit.serial)) : undefined;
      return json({
        valid: true, holderOk, card: hit.card.file, name: hit.card.name, serial: hit.serial, run: hit.run,
        checks: checks[key].n, recorded: serialInList(registry[hit.card.file], hit.serial),
      });
    }
    if (url.pathname === "/api/events") {
      if (request.method === "GET") {
        return json((await env.CARDS_KV.get("events", "json")) || [], 200, { "cache-control": "public, max-age=30" });
      }
      if (request.method !== "PUT") return json({ error: "method not allowed" }, 405, { allow: "GET, PUT" });
      const body = await request.text();
      if (!(await isAdmin(request, env, body))) return json({ error: "not allowed" }, 401);
      let list;
      try {
        list = cleanEvents(JSON.parse(body));
      } catch {
        list = null;
      }
      if (!list) return json({ error: "invalid events" }, 400);
      const old = (await env.CARDS_KV.get("events", "json")) || [];
      const keep = new Set(list.filter((e) => e.image).map((e) => e.id));
      for (const e of old) if (!keep.has(e.id)) await env.CARDS_KV.delete("evimg:" + e.id);
      await env.CARDS_KV.put("events", JSON.stringify(list));
      return json({ ok: true, events: list });
    }
    if (url.pathname === "/api/dl-codes") {
      // admin only: make download codes for a paid digital file
      if (request.method !== "POST") return json({ error: "method not allowed" }, 405, { allow: "POST" });
      const body = await request.text();
      if (!(await isAdmin(request, env, body))) return json({ error: "not allowed" }, 401);
      let req;
      try {
        req = JSON.parse(body);
      } catch {
        return json({ error: "bad json" }, 400);
      }
      const count = Number(req.count), uses = Number(req.uses);
      if (!/^[a-z0-9-]{1,40}$/.test(req.id || "") || !Number.isInteger(count) || count < 1 || count > 50 || !Number.isInteger(uses) || uses < 1 || uses > 20) return json({ error: "bad request" }, 400);
      if (!(await findItem(env, req.id, false))) return json({ error: "save the item with its file first" }, 400);
      const book = (await env.CARDS_KV.get("dlcodes", "json")) || {};
      const codes = [];
      for (let i = 0; i < count; i++) {
        const code = makeDlCode();
        book[await sha256hex(code)] = { id: req.id, uses, used: 0 };
        codes.push(code);
      }
      await env.CARDS_KV.put("dlcodes", JSON.stringify(book));
      return json({ ok: true, codes });
    }
    if (url.pathname === "/api/download") {
      // public: a download code gives the paid file, a limited number of times
      if (request.method !== "GET") return json({ error: "method not allowed" }, 405, { allow: "GET" });
      const ip = request.headers.get("cf-connecting-ip") || "x";
      const now = Date.now();
      const slot = attempts.get("d" + ip) || { n: 0, reset: now + 60000 };
      if (now > slot.reset) { slot.n = 0; slot.reset = now + 60000; }
      slot.n++;
      attempts.set("d" + ip, slot);
      if (slot.n > 10) return json({ error: "too many tries, wait a minute" }, 429);
      const code = (url.searchParams.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length !== 12) return json({ error: "code not found" }, 404);
      const book = (await env.CARDS_KV.get("dlcodes", "json")) || {};
      const hash = await sha256hex(code);
      const rec = book[hash];
      if (!rec) return json({ error: "code not found" }, 404);
      if (rec.used >= rec.uses) return json({ error: "this code has been used up" }, 403);
      const item = await findItem(env, rec.id, false);
      const data = item ? await env.CARDS_KV.get("dl:" + rec.id, "arrayBuffer") : null;
      if (!data) return json({ error: "file not available" }, 404);
      rec.used++;
      await env.CARDS_KV.put("dlcodes", JSON.stringify(book));
      return fileResponse(data, item, "no-store");
    }
    if (url.pathname === "/api/file") {
      // free downloads: raw bytes, signed by the hash of the bytes
      const id = url.searchParams.get("id") || "";
      if (!/^[a-z0-9-]{1,40}$/.test(id)) return json({ error: "bad id" }, 400);
      if (request.method === "GET") {
        const item = await findItem(env, id, true);
        const data = item ? await env.CARDS_KV.get("dl:" + id, "arrayBuffer") : null;
        if (!data) return new Response("not found", { status: 404 });
        return fileResponse(data, item, "public, max-age=3600");
      }
      if (request.method !== "PUT") return json({ error: "method not allowed" }, 405, { allow: "GET, PUT" });
      const bytes = await request.arrayBuffer();
      if (!(await isAdmin(request, env, bytes))) return json({ error: "not allowed" }, 401);
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE) return json({ error: "file too big (20 MB max)" }, 413);
      await env.CARDS_KV.put("dl:" + id, bytes);
      return json({ ok: true, size: bytes.byteLength });
    }
    if (url.pathname === "/api/catalog") {
      // stickers and prints lists: GET public, PUT admin
      const kind = url.searchParams.get("kind") || "";
      if (kind !== "stickers" && kind !== "prints" && kind !== "free") return json({ error: "bad kind" }, 400);
      const key = "catalog:" + kind;
      if (request.method === "GET") return json((await env.CARDS_KV.get(key, "json")) || [], 200, { "cache-control": "public, max-age=30" });
      if (request.method !== "PUT") return json({ error: "method not allowed" }, 405, { allow: "GET, PUT" });
      const body = await request.text();
      if (!(await isAdmin(request, env, body))) return json({ error: "not allowed" }, 401);
      let list;
      try {
        list = cleanCatalog(JSON.parse(body));
      } catch {
        list = null;
      }
      if (!list) return json({ error: "invalid items" }, 400);
      const old = (await env.CARDS_KV.get(key, "json")) || [];
      const keep = new Set(list.filter((e) => e.image).map((e) => e.id));
      for (const e of old) if (!keep.has(e.id)) await env.CARDS_KV.delete("evimg:" + e.id);
      const keepFiles = new Set(list.filter((e) => e.file).map((e) => e.id));
      for (const e of old) if (e.file && !keepFiles.has(e.id)) await env.CARDS_KV.delete("dl:" + e.id);
      await env.CARDS_KV.put(key, JSON.stringify(list));
      return json({ ok: true, items: list });
    }
    if (url.pathname === "/api/event-image") {
      // body is the base64 text of a small WebP picture, so the signed payload hash covers it exactly
      const id = url.searchParams.get("id") || "";
      if (!/^[a-z0-9-]{1,40}$/.test(id)) return json({ error: "bad id" }, 400);
      if (request.method === "GET") {
        const b64 = await env.CARDS_KV.get("evimg:" + id);
        if (!b64) return new Response("not found", { status: 404 });
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        return new Response(bin, { headers: { "content-type": "image/webp", "cache-control": "public, max-age=86400" } });
      }
      if (request.method !== "PUT") return json({ error: "method not allowed" }, 405, { allow: "GET, PUT" });
      const body = await request.text();
      if (!(await isAdmin(request, env, body))) return json({ error: "not allowed" }, 401);
      if (body.length > 400000 || !/^[A-Za-z0-9+/]+=*$/.test(body)) return json({ error: "bad image" }, 400);
      await env.CARDS_KV.put("evimg:" + id, body);
      return json({ ok: true });
    }
    if (url.pathname !== "/api/stock") return env.ASSETS.fetch(request);

    if (request.method === "GET") {
      const stock = (await env.CARDS_KV.get(KEY, "json")) || {};
      return json(stock, 200, { "cache-control": "public, max-age=30" });
    }
    if (request.method === "PUT") {
      const body = await request.text();
      if (body.length > 20000) return json({ error: "too large" }, 413);
      if (!(await isAdmin(request, env, body))) return json({ error: "not allowed" }, 401);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return json({ error: "bad json" }, 400);
      }
      const cleaned = clean(parsed);
      if (!cleaned) return json({ error: "bad data" }, 400);
      await env.CARDS_KV.put(KEY, JSON.stringify(cleaned.stock));
      await env.CARDS_KV.put("registry", JSON.stringify(cleaned.registry));
      return json({ ok: true, stock: cleaned.stock });
    }
    return json({ error: "method not allowed" }, 405, { allow: "GET, PUT" });
  },
};

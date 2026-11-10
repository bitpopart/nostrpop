// POPART.love stock API.
// GET  /api/stock  public: current status and copies left per card.
// PUT  /api/stock  admin only: needs a NIP-98 signed Nostr event from ADMIN_PUBKEY.
// Everything else is served from the static site (assets).
import { verifyEvent } from "nostr-tools/pure";

const KEY = "stock";
const attempts = new Map();
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map((b) => ALPHABET[b & 31]).join("");
}
function normalizeCode(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
}
const STATUSES = ["available", "sold-out", "coming-soon"];
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

async function sha256hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
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
    if (url.pathname === "/api/codes") {
      // admin only: make a fresh set of secret verification codes for one card (replaces older ones)
      if (request.method !== "POST") return json({ error: "method not allowed" }, 405, { allow: "POST" });
      const body = await request.text();
      if (!(await isAdmin(request, env, body))) return json({ error: "not allowed" }, 401);
      let file;
      try {
        file = JSON.parse(body).card;
      } catch {
        return json({ error: "bad json" }, 400);
      }
      const cards = await (await env.ASSETS.fetch(new URL("/assets/cards.json", request.url))).json();
      const card = cards.find((c) => c.file === file);
      const run = card ? runOf(card) : null;
      if (!card || run === null || run > 1000) return json({ error: "this card has no numbered run" }, 400);
      const index = (await env.CARDS_KV.get("codes", "json")) || {};
      for (const h of Object.keys(index)) if (index[h][0] === file) delete index[h];
      const checks = (await env.CARDS_KV.get("checks", "json")) || {};
      const issued = [];
      for (let serial = 1; serial <= run; serial++) {
        let code, hash;
        do {
          code = makeCode();
          hash = await sha256hex(code);
        } while (index[hash]);
        index[hash] = [file, serial];
        issued.push({ serial, code });
      }
      for (const h of Object.keys(checks)) if (!index[h]) delete checks[h];
      await env.CARDS_KV.put("codes", JSON.stringify(index));
      await env.CARDS_KV.put("checks", JSON.stringify(checks));
      return json({ ok: true, card: file, run, codes: issued });
    }
    if (url.pathname === "/api/verify") {
      // public: look a secret code up. Returns the card and copy number it belongs to.
      if (request.method !== "GET") return json({ error: "method not allowed" }, 405, { allow: "GET" });
      const ip = request.headers.get("cf-connecting-ip") || "x";
      const now = Date.now();
      const slot = attempts.get(ip) || { n: 0, reset: now + 60000 };
      if (now > slot.reset) { slot.n = 0; slot.reset = now + 60000; }
      slot.n++;
      attempts.set(ip, slot);
      if (attempts.size > 5000) attempts.clear();
      if (slot.n > 10) return json({ error: "too many tries, wait a minute" }, 429);
      const code = normalizeCode(url.searchParams.get("code") || "");
      if (code.length !== 10) return json({ valid: false });
      const hash = await sha256hex(code);
      const index = (await env.CARDS_KV.get("codes", "json")) || {};
      const hit = index[hash];
      if (!hit) return json({ valid: false });
      const [file, serial] = hit;
      const cards = await (await env.ASSETS.fetch(new URL("/assets/cards.json", request.url))).json();
      const card = cards.find((c) => c.file === file);
      const checks = (await env.CARDS_KV.get("checks", "json")) || {};
      const prev = checks[hash] || { n: 0, first: now };
      checks[hash] = { n: prev.n + 1, first: prev.first };
      await env.CARDS_KV.put("checks", JSON.stringify(checks));
      const registry = (await env.CARDS_KV.get("registry", "json")) || {};
      return json({
        valid: true, card: file, name: card ? card.name : file, serial, run: card ? runOf(card) : null,
        checks: checks[hash].n, first: prev.first, recorded: serialInList(registry[file], serial),
      });
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

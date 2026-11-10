// POPART.love stock API.
// GET  /api/stock  public: current status and copies left per card.
// PUT  /api/stock  admin only: needs a NIP-98 signed Nostr event from ADMIN_PUBKEY.
// Everything else is served from the static site (assets).
import { verifyEvent } from "nostr-tools/pure";

const KEY = "stock";
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
      // public: is this serial valid for this card, and is it on the artist's sold list?
      if (request.method !== "GET") return json({ error: "method not allowed" }, 405, { allow: "GET" });
      const file = url.searchParams.get("card") || "";
      const serial = Number(url.searchParams.get("serial"));
      const cards = await (await env.ASSETS.fetch(new URL("/assets/cards.json", request.url))).json();
      const card = cards.find((c) => c.file === file);
      if (!card || !Number.isInteger(serial) || serial < 1) return json({ error: "bad request" }, 400);
      const run = runOf(card);
      if (run === null) return json({ card: file, open: true });
      if (serial > run) return json({ card: file, run, serial, valid: false });
      const registry = (await env.CARDS_KV.get("registry", "json")) || {};
      const res = { card: file, run, serial, valid: true, recorded: serialInList(registry[file], serial) };
      const given = (url.searchParams.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (env.CODE_SECRET && given) res.codeOk = given === (await copyCode(env.CODE_SECRET, file, serial));
      return json(res);
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

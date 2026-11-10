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

function clean(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out = {};
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
    out[k] = { status: v.status, left, online, offline, url: link };
  }
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
      const stock = clean(parsed);
      if (!stock) return json({ error: "bad data" }, 400);
      await env.CARDS_KV.put(KEY, JSON.stringify(stock));
      return json({ ok: true, stock });
    }
    return json({ error: "method not allowed" }, 405, { allow: "GET, PUT" });
  },
};

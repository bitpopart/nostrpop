import { PAGE_OWNER_PUBKEYS } from '@/lib/adminUtils';
import { JUSTB_KIND, JUSTB_D_TAG } from '@/lib/justb';

/** Blossom file servers the site uploads to (see useUploadFile). */
export const BLOSSOM_SERVERS = [
  'https://blossom.primal.net/',
  'https://blossom.azzamo.media/',
  'https://bitpopart.blossom.band/',
];

/** Extra relays the static Just B pages (ledger, verify, claims) talk to on their own. */
export const JUSTB_PAGE_RELAYS: { url: string; name: string }[] = [
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://nos.lol', name: 'nos.lol' },
];

export interface Nip11Info {
  name?: string;
  description?: string;
  software?: string;
  version?: string;
  supportedNips?: number[];
  authRequired?: boolean;
  paymentRequired?: boolean;
  restrictedWrites?: boolean;
  contact?: string;
}

export type RelayStatus = 'ok' | 'slow' | 'auth' | 'down';

export interface RelayReport {
  url: string;
  status: RelayStatus;
  /** ms to open the websocket (null = never opened). */
  connectMs: number | null;
  /** ms from sending the query to the relay answering (EOSE or CLOSED). */
  answerMs: number | null;
  /** The relay holds the Just B site config event. */
  hasSiteData: boolean;
  /** created_at (unix s) of that event on this relay. */
  siteEventAt: number | null;
  /** The relay asked for NIP-42 AUTH or refused anonymous reads. */
  authGated: boolean;
  /** Raw reason when the relay closed the query or errored. */
  detail: string;
  info: Nip11Info | null;
}

export interface BlossomReport {
  url: string;
  ok: boolean;
  ms: number | null;
}

const SLOW_MS = 2000;

async function fetchNip11(wsUrl: string): Promise<Nip11Info | null> {
  try {
    const res = await fetch(wsUrl.replace(/^ws/, 'http'), {
      headers: { Accept: 'application/nostr+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    const lim = (j.limitation && typeof j.limitation === 'object' ? j.limitation : {}) as Record<string, unknown>;
    return {
      name: typeof j.name === 'string' ? j.name : undefined,
      description: typeof j.description === 'string' ? j.description : undefined,
      software: typeof j.software === 'string' ? j.software : undefined,
      version: typeof j.version === 'string' ? j.version : undefined,
      supportedNips: Array.isArray(j.supported_nips) ? j.supported_nips.filter((n): n is number => typeof n === 'number') : undefined,
      authRequired: lim.auth_required === true,
      paymentRequired: lim.payment_required === true,
      restrictedWrites: lim.restricted_writes === true,
      contact: typeof j.contact === 'string' ? j.contact : undefined,
    };
  } catch {
    return null; // many relays do not send CORS headers for NIP-11; that is fine
  }
}

/** Open the relay, ask it for the Just B config event, and time everything. */
export async function checkRelay(url: string): Promise<RelayReport> {
  const info = fetchNip11(url);
  const report: RelayReport = {
    url, status: 'down', connectMs: null, answerMs: null,
    hasSiteData: false, siteEventAt: null, authGated: false, detail: '', info: null,
  };

  await new Promise<void>((resolve) => {
    let ws: WebSocket;
    const t0 = performance.now();
    let sentAt = 0;
    let settled = false;
    const finish = (detail?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (detail && !report.detail) report.detail = detail;
      try { ws.close(); } catch { /* already closed */ }
      resolve();
    };
    const timer = setTimeout(() => finish(report.connectMs === null ? 'No connection after 8 s' : 'No answer to the query after 8 s'), 8000);
    try {
      ws = new WebSocket(url);
    } catch (e) {
      finish(e instanceof Error ? e.message : 'Invalid address');
      return;
    }
    const sub = 'rk' + Math.random().toString(36).slice(2, 8);
    ws.onopen = () => {
      report.connectMs = Math.round(performance.now() - t0);
      sentAt = performance.now();
      ws.send(JSON.stringify(['REQ', sub, {
        kinds: [JUSTB_KIND], authors: PAGE_OWNER_PUBKEYS, '#d': [JUSTB_D_TAG], limit: 1,
      }]));
    };
    ws.onmessage = (m) => {
      try {
        const a = JSON.parse(String(m.data)) as unknown[];
        if (a[0] === 'AUTH') { report.authGated = true; }
        else if (a[0] === 'EVENT' && a[1] === sub) {
          const ev = a[2] as { created_at?: number };
          report.hasSiteData = true;
          report.siteEventAt = Math.max(report.siteEventAt ?? 0, ev.created_at ?? 0) || null;
        } else if (a[0] === 'EOSE' && a[1] === sub) {
          report.answerMs = Math.round(performance.now() - sentAt);
          finish();
        } else if (a[0] === 'CLOSED' && a[1] === sub) {
          report.answerMs = Math.round(performance.now() - sentAt);
          const why = String(a[2] ?? '');
          if (/auth|restricted|blocked|paid|payment/i.test(why)) report.authGated = true;
          finish(why || 'Relay closed the query');
        } else if (a[0] === 'NOTICE') {
          report.detail = String(a[1] ?? '');
        }
      } catch { /* ignore non-JSON frames */ }
    };
    ws.onerror = () => finish('Connection error');
    ws.onclose = () => finish(report.connectMs === null ? 'Connection refused or closed' : 'Closed before answering');
  });

  report.info = await info;
  if (report.connectMs === null || report.answerMs === null) report.status = 'down';
  else if (report.authGated && !report.hasSiteData) report.status = 'auth';
  else if (report.answerMs > SLOW_MS || report.connectMs > SLOW_MS) report.status = 'slow';
  else report.status = 'ok';
  return report;
}

/** Is the Blossom server reachable? (opaque no-cors request: only reachability, not auth) */
export async function checkBlossom(url: string): Promise<BlossomReport> {
  const t0 = performance.now();
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(6000) });
    return { url, ok: true, ms: Math.round(performance.now() - t0) };
  } catch {
    return { url, ok: false, ms: null };
  }
}

export interface Advice {
  level: 'critical' | 'warn' | 'info';
  text: string;
}

/** Turn the raw reports into plain-language things to do. */
export function adviseRelays(relays: RelayReport[], blossom: BlossomReport[]): Advice[] {
  const out: Advice[] = [];
  const newest = Math.max(0, ...relays.map((r) => r.siteEventAt ?? 0));
  const serving = relays.filter((r) => r.status !== 'down' && r.hasSiteData && !r.authGated);
  if (relays.length > 0 && serving.length < 2) {
    out.push({
      level: 'critical',
      text: serving.length === 0
        ? 'No relay answered with your Just B config. The live site could show default content. Check your internet, then re-save the Just B tab to republish.'
        : 'Only one relay serves your site settings without a login. If it goes down the site loses its settings. Add another open relay in src/App.tsx.',
    });
  }
  for (const r of relays) {
    const host = r.url.replace('wss://', '');
    if (r.status === 'down') out.push({ level: 'warn', text: `${host} is not reachable (${r.detail || 'no answer'}). Visitors skip it automatically, but if it stays down remove it from the relay list in src/App.tsx.` });
    else if (r.status === 'auth') out.push({ level: 'warn', text: `${host} wants a login (NIP-42) or payment before it shares data, so it adds nothing for anonymous visitors. Fine as a write relay, but do not rely on it for reading.` });
    else if (r.status === 'slow') out.push({ level: 'info', text: `${host} is slow (${r.answerMs ?? r.connectMs} ms). If this repeats, move it to write-only in src/App.tsx.` });
    if (r.status !== 'down' && r.hasSiteData && r.siteEventAt && newest - r.siteEventAt > 60) {
      out.push({ level: 'warn', text: `${host} holds an older copy of your Just B config. Press Save in the Just B tab to push the current version to every relay.` });
    }
    if (r.info?.paymentRequired || r.info?.restrictedWrites) {
      out.push({ level: 'info', text: `${host} limits who can publish (${[r.info.paymentRequired && 'payment required', r.info.restrictedWrites && 'restricted writes'].filter(Boolean).join(', ')}). Publishes from the admin may be refused there unless your key is allowed.` });
    }
  }
  for (const b of blossom) {
    if (!b.ok) out.push({ level: 'warn', text: `Blossom server ${b.url.replace('https://', '').replace(/\/$/, '')} is not reachable. Uploads still work through the other server. If it stays down, remove it in src/hooks/useUploadFile.ts.` });
  }
  if (blossom.length > 0 && blossom.every((b) => !b.ok)) {
    out.push({ level: 'critical', text: 'No Blossom server is reachable, so image and file uploads will fail right now.' });
  }
  return out;
}

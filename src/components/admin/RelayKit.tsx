import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, HardDrive, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/hooks/useAppContext';
import {
  BLOSSOM_SERVERS,
  JUSTB_PAGE_RELAYS,
  adviseRelays,
  checkBlossom,
  checkRelay,
  type Advice,
  type BlossomReport,
  type RelayReport,
  type RelayStatus,
} from '@/lib/relayHealth';

interface RelayRow {
  url: string;
  name: string;
  /** Where the site uses it. */
  roles: string[];
}

const STATUS_STYLE: Record<RelayStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: 'Working', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', Icon: CheckCircle2 },
  slow: { label: 'Slow', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', Icon: Clock },
  auth: { label: 'Login / payment needed', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', Icon: ShieldAlert },
  down: { label: 'Not reachable', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', Icon: XCircle },
};

function ago(unix: number | null): string {
  if (!unix) return 'none';
  const s = Math.max(0, Math.floor(Date.now() / 1000) - unix);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

interface HistoryPoint {
  /** unix ms of the check */
  t: number;
  status: RelayStatus;
  /** answer time in ms (null when down) */
  ms: number | null;
}
type History = Record<string, HistoryPoint[]>;
const HISTORY_KEY = 'relaykit-history-v1';
const HISTORY_MAX = 120;

function loadHistory(): History {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as History) : {};
  } catch {
    return {};
  }
}
function saveHistory(h: History) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch { /* private mode: history just stays in memory */ }
}

const DOT: Record<RelayStatus, string> = {
  ok: 'bg-green-500',
  slow: 'bg-yellow-500',
  auth: 'bg-orange-500',
  down: 'bg-red-500',
};
const BAR: Record<RelayStatus, string> = {
  ok: 'bg-green-500',
  slow: 'bg-yellow-500',
  auth: 'bg-orange-400',
  down: 'bg-red-500',
};

function Tile({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${tone}`}>
      <div className="text-3xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

/**
 * RelayKit: live health of every relay and file server the site depends on.
 * Opens real connections from this browser, so it shows what a visitor gets.
 */
export function RelayKit() {
  const { config, presetRelays = [] } = useAppContext();
  const [reports, setReports] = useState<Record<string, RelayReport>>({});
  const [blossom, setBlossom] = useState<BlossomReport[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [auto, setAuto] = useState(true);
  const runId = useRef(0);
  const [history, setHistory] = useState<History>(loadHistory);

  // Every relay the site touches, merged by address.
  const rows: RelayRow[] = (() => {
    const map = new Map<string, RelayRow>();
    const add = (url: string, name: string, role: string) => {
      const row = map.get(url) ?? { url, name, roles: [] };
      if (!row.roles.includes(role)) row.roles.push(role);
      map.set(url, row);
    };
    add(config.relayUrl, presetRelays.find((p) => p.url === config.relayUrl)?.name ?? config.relayUrl.replace('wss://', ''), 'Selected relay');
    for (const p of presetRelays) {
      if (p.read !== false) add(p.url, p.name, 'Reads');
      if (p.write !== false) add(p.url, p.name, 'Writes');
    }
    for (const r of JUSTB_PAGE_RELAYS) add(r.url, r.name, 'Just B pages');
    return [...map.values()];
  })();
  const rowKey = rows.map((r) => r.url).join('|');

  const runChecks = useCallback(async () => {
    const id = ++runId.current;
    setChecking(true);
    const urls = rowKey.split('|').filter(Boolean);
    const fresh: RelayReport[] = [];
    await Promise.all([
      ...urls.map(async (u) => {
        const r = await checkRelay(u);
        fresh.push(r);
        if (runId.current === id) setReports((prev) => ({ ...prev, [u]: r }));
      }),
      Promise.all(BLOSSOM_SERVERS.map(checkBlossom)).then((b) => {
        if (runId.current === id) setBlossom(b);
      }),
    ]);
    if (runId.current === id) {
      const now = Date.now();
      setHistory((prev) => {
        const next: History = { ...prev };
        for (const r of fresh) {
          next[r.url] = [...(next[r.url] ?? []), { t: now, status: r.status, ms: r.answerMs }].slice(-HISTORY_MAX);
        }
        saveHistory(next);
        return next;
      });
    }
    if (runId.current === id) {
      setChecking(false);
      setCheckedAt(new Date());
    }
  }, [rowKey]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => void runChecks(), 60_000);
    return () => clearInterval(t);
  }, [auto, runChecks]);

  const done = rows.map((r) => reports[r.url]).filter((r): r is RelayReport => !!r);
  const advice: Advice[] = done.length === rows.length && blossom.length > 0 ? adviseRelays(done, blossom) : [];
  const critical = advice.filter((a) => a.level === 'critical');
  const warn = advice.filter((a) => a.level === 'warn');
  const working = done.filter((r) => r.status === 'ok' || r.status === 'slow').length;

  const banner = (() => {
    if (done.length < rows.length || blossom.length === 0) return { tone: 'bg-muted text-muted-foreground', text: 'Checking every relay and file server…', Icon: Activity };
    if (critical.length > 0) return { tone: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200', text: 'The live site is at risk. Read the actions below.', Icon: XCircle };
    if (warn.length > 0) return { tone: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200', text: `The site is live, ${warn.length} thing${warn.length === 1 ? '' : 's'} need${warn.length === 1 ? 's' : ''} your attention.`, Icon: AlertTriangle };
    return { tone: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200', text: 'All relays and file servers look healthy. The site is fully live.', Icon: CheckCircle2 };
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" /> RelayKit
        </CardTitle>
        <CardDescription>
          Live health of every Nostr relay and file server bitpopart.com depends on. The checks run from your browser,
          so they show what a visitor gets: does the relay answer, how fast, and does it still hold your Just B site
          settings. It re-checks every minute while this tab is open. Nothing is checked while the admin is closed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className={`flex items-center gap-3 rounded-lg p-3 text-sm font-medium ${banner.tone}`}>
          <banner.Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{banner.text}</span>
          {done.length === rows.length && <span className="text-xs font-normal">{working} of {rows.length} relays answering</span>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => void runChecks()} disabled={checking}>
            <RefreshCw className={`mr-1 h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> {checking ? 'Checking…' : 'Check now'}
          </Button>
          <div className="flex items-center gap-2">
            <Switch id="relaykit-auto" checked={auto} onCheckedChange={setAuto} />
            <Label htmlFor="relaykit-auto" className="text-xs">Re-check every minute</Label>
          </div>
          {checkedAt && <span className="text-xs text-muted-foreground">Last checked {checkedAt.toLocaleTimeString()}</span>}
        </div>

        {done.length === rows.length && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Tile value={done.filter((r) => r.status === 'ok').length} label="Working" tone="border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" />
              <Tile value={done.filter((r) => r.status === 'slow').length} label="Slow" tone="border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" />
              <Tile value={done.filter((r) => r.status === 'auth').length} label="Login needed" tone="border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" />
              <Tile value={done.filter((r) => r.status === 'down').length} label="Down" tone="border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300" />
              <Tile value={`${blossom.filter((b) => b.ok).length}/${blossom.length}`} label="File servers up" tone="border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" />
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="mb-2 text-sm font-semibold">Answer time (shorter is better)</h3>
              <div className="space-y-1.5">
                {(() => {
                  const max = Math.max(1000, ...done.map((r) => r.answerMs ?? 0));
                  return rows.map((row) => {
                    const r = reports[row.url];
                    if (!r) return null;
                    const pct = r.answerMs === null ? 100 : Math.max(2, Math.round((r.answerMs / max) * 100));
                    return (
                      <div key={row.url} className="flex items-center gap-2 text-xs">
                        <span className="w-28 shrink-0 truncate sm:w-36">{r.info?.name || row.name}</span>
                        <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                          <div className={`h-full rounded ${BAR[r.status]} ${r.answerMs === null ? 'opacity-30' : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">{r.answerMs === null ? 'no answer' : `${r.answerMs} ms`}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="mb-1 text-sm font-semibold">Recent checks</h3>
              <p className="mb-2 text-xs text-muted-foreground">
                One dot per check made from this browser (newest on the right). It builds up each time you keep this tab open.
              </p>
              <div className="space-y-1.5">
                {rows.map((row) => {
                  const pts = history[row.url] ?? [];
                  if (pts.length === 0) return null;
                  const up = Math.round((pts.filter((p) => p.status !== 'down').length / pts.length) * 100);
                  return (
                    <div key={row.url} className="flex items-center gap-2 text-xs">
                      <span className="w-28 shrink-0 truncate sm:w-36">{reports[row.url]?.info?.name || row.name}</span>
                      <div className="flex flex-1 flex-wrap gap-[3px]">
                        {pts.map((p) => (
                          <span
                            key={p.t}
                            title={`${new Date(p.t).toLocaleTimeString()}: ${STATUS_STYLE[p.status].label}${p.ms !== null ? `, ${p.ms} ms` : ''}`}
                            className={`h-2.5 w-2.5 rounded-full ${DOT[p.status]}`}
                          />
                        ))}
                      </div>
                      <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">{up}% up</span>
                    </div>
                  );
                })}
              </div>
              {Object.keys(history).length > 0 && (
                <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => { setHistory({}); saveHistory({}); }}>
                  Clear history
                </Button>
              )}
            </div>
          </div>
        )}

        {advice.length > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <h3 className="text-sm font-semibold">What to do</h3>
            <ul className="space-y-1.5 text-sm">
              {[...critical, ...warn, ...advice.filter((a) => a.level === 'info')].map((a, i) => (
                <li key={i} className="flex gap-2">
                  {a.level === 'critical' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    : a.level === 'warn' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                    : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span>{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Details per relay</h3>
          {rows.map((row) => {
            const r = reports[row.url];
            const st = r ? STATUS_STYLE[r.status] : null;
            return (
              <div key={row.url} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r?.info?.name || row.name}</span>
                  <code className="text-xs text-muted-foreground">{row.url}</code>
                  <span className="flex-1" />
                  {st ? (
                    <Badge className={`gap-1 ${st.className}`} variant="secondary"><st.Icon className="h-3.5 w-3.5" /> {st.label}</Badge>
                  ) : (
                    <Badge variant="secondary">Checking…</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {row.roles.map((role) => (<Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>))}
                </div>
                {r && (
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                    <div><dt className="text-muted-foreground">Connect</dt><dd>{r.connectMs === null ? '–' : `${r.connectMs} ms`}</dd></div>
                    <div><dt className="text-muted-foreground">Answers a query</dt><dd>{r.answerMs === null ? '–' : `${r.answerMs} ms`}</dd></div>
                    <div><dt className="text-muted-foreground">Holds Just B config</dt><dd>{r.hasSiteData ? `Yes, saved ${ago(r.siteEventAt)}` : 'No'}</dd></div>
                    <div><dt className="text-muted-foreground">Software</dt><dd>{r.info?.software ? `${r.info.software.split('/').pop()} ${r.info.version ?? ''}` : 'unknown'}</dd></div>
                  </dl>
                )}
                {r?.detail && r.status !== 'ok' && <p className="mt-1 text-xs text-muted-foreground">Relay says: {r.detail}</p>}
                {r?.info && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.info.supportedNips ? `${r.info.supportedNips.length} NIPs supported. ` : ''}
                    {r.info.authRequired ? 'Needs login (NIP-42). ' : ''}
                    {r.info.paymentRequired ? 'Payment required. ' : ''}
                    {r.info.restrictedWrites ? 'Writes restricted. ' : ''}
                    {r.info.contact ? `Contact: ${r.info.contact}` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><HardDrive className="h-4 w-4" /> File servers (Blossom)</h3>
          {blossom.length === 0 && <p className="text-xs text-muted-foreground">Checking…</p>}
          {blossom.map((b) => (
            <div key={b.url} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
              <code className="text-xs">{b.url}</code>
              <span className="flex-1" />
              {b.ok ? (
                <Badge className={`gap-1 ${STATUS_STYLE.ok.className}`} variant="secondary"><CheckCircle2 className="h-3.5 w-3.5" /> Reachable, {b.ms} ms</Badge>
              ) : (
                <Badge className={`gap-1 ${STATUS_STYLE.down.className}`} variant="secondary"><XCircle className="h-3.5 w-3.5" /> Not reachable</Badge>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          To change the lists: relays are in <code>src/App.tsx</code> (presetRelays), file servers in{' '}
          <code>src/lib/relayHealth.ts</code> (BLOSSOM_SERVERS). Tell Claude which to add or remove and it will do it.
          A relay that is only slow now and then is normal; act when the same warning shows up several checks in a row.
        </p>
      </CardContent>
    </Card>
  );
}

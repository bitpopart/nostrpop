import { useFearGreedIndex, STATE_DEFAULT_EMOJI, STATE_LABELS } from '@/hooks/useFearGreedIndex';
import type { FearGreedEntry, FearGreedState } from '@/hooks/useFearGreedIndex';
import { useFearGreedMeterImages } from '@/hooks/useFearGreedMeter';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Minus, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── State config ─────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<FearGreedState, { label: string; arcColor: string; textColor: string; badgeBg: string }> = {
  'extreme-fear': { label: 'Extreme Fear',  arcColor: '#ef4444', textColor: '#ef4444', badgeBg: 'bg-red-500' },
  'fear':         { label: 'Fear',          arcColor: '#f97316', textColor: '#f97316', badgeBg: 'bg-orange-500' },
  'neutral':      { label: 'Neutral',       arcColor: '#eab308', textColor: '#eab308', badgeBg: 'bg-yellow-500' },
  'greed':        { label: 'Greed',         arcColor: '#84cc16', textColor: '#84cc16', badgeBg: 'bg-lime-500' },
  'extreme-greed':{ label: 'Extreme Greed', arcColor: '#22c55e', textColor: '#22c55e', badgeBg: 'bg-green-500' },
};

function stateColor(v: number): string {
  if (v <= 24) return '#ef4444';
  if (v <= 44) return '#f97316';
  if (v <= 55) return '#eab308';
  if (v <= 74) return '#84cc16';
  return '#22c55e';
}

// ─── Semicircular Gauge ────────────────────────────────────────────────────────

function GaugeSvg({ value, state }: { value: number; state: FearGreedState }) {
  // Geometry
  const W = 280, H = 160;
  const CX = W / 2, CY = H - 20;
  const R = 100;
  const STROKE = 20;
  const GAP = 4; // gap between segments in degrees

  // Segments: [startDeg, endDeg, color]  — 0° = right, 180° = left
  const segs: [number, number, string][] = [
    [0,   36,  '#22c55e'],
    [36,  72,  '#84cc16'],
    [72,  108, '#eab308'],
    [108, 144, '#f97316'],
    [144, 180, '#ef4444'],
  ];

  function polarToXY(deg: number, r: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: CX - r * Math.cos(rad), y: CY - r * Math.sin(rad) };
  }

  function segPath(fromDeg: number, toDeg: number, r: number, sw: number) {
    const f = polarToXY(fromDeg + GAP / 2, r);
    const t = polarToXY(toDeg - GAP / 2, r);
    const large = toDeg - fromDeg - GAP > 180 ? 1 : 0;
    const ri = r - sw / 2;
    const ro = r + sw / 2;
    const fi = polarToXY(fromDeg + GAP / 2, ri);
    const ti = polarToXY(toDeg - GAP / 2, ri);
    const fo = polarToXY(fromDeg + GAP / 2, ro);
    const to2 = polarToXY(toDeg - GAP / 2, ro);
    return `M ${fo.x} ${fo.y} A ${ro} ${ro} 0 ${large} 0 ${to2.x} ${to2.y}
            L ${ti.x} ${ti.y} A ${ri} ${ri} 0 ${large} 1 ${fi.x} ${fi.y} Z`;
  }

  // Needle angle: value 0 → 180° (left/Extreme Fear), value 100 → 0° (right/Extreme Greed)
  const needleDeg = 180 - (value / 100) * 180;
  const needleTip = polarToXY(needleDeg, R - 4);
  const activeColor = stateColor(value);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto" style={{ overflow: 'visible' }}>
      {/* Background arc segments (dimmed) */}
      {segs.map(([from, to, col], i) => (
        <path key={i} d={segPath(from, to, R, STROKE)} fill={col} opacity="0.18" />
      ))}

      {/* Active filled arc from 180° (Fear) to needleDeg */}
      {value > 0 && (() => {
        const fromDeg = needleDeg;
        const toDeg = 180;
        const f = polarToXY(fromDeg, R);
        const t = polarToXY(toDeg, R);
        const large = toDeg - fromDeg > 180 ? 1 : 0;
        return (
          <path
            d={`M ${f.x} ${f.y} A ${R} ${R} 0 ${large} 0 ${t.x} ${t.y}`}
            fill="none"
            stroke={activeColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity="0.9"
          />
        );
      })()}

      {/* Bright segment outlines for current zone */}
      {segs.map(([from, to, col], i) => {
        const midVal = ((i) / 5) * 100 + 10;
        const isActive =
          (i === 0 && value > 75) ||
          (i === 1 && value > 55 && value <= 75) ||
          (i === 2 && value > 44 && value <= 55) ||
          (i === 3 && value > 24 && value <= 44) ||
          (i === 4 && value <= 24);
        if (!isActive) return null;
        return <path key={`a${i}`} d={segPath(from, to, R, STROKE)} fill={col} opacity="0.9" />;
      })}

      {/* Zone label ticks */}
      {['Extreme\nFear', '', 'Neutral', '', 'Extreme\nGreed'].map((lbl, i) => {
        if (!lbl) return null;
        const deg = i * 45;
        const p = polarToXY(deg, R + STROKE + 12);
        const lines = lbl.split('\n');
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize="9" fontWeight="600" fill={segs[4 - i]?.[2] ?? '#888'} opacity="0.75">
            {lines.map((l, j) => <tspan key={j} x={p.x} dy={j === 0 ? 0 : 10}>{l}</tspan>)}
          </text>
        );
      })}

      {/* Needle shadow */}
      <line x1={CX} y1={CY} x2={needleTip.x + 1} y2={needleTip.y + 1} stroke="rgba(0,0,0,0.25)" strokeWidth="4" strokeLinecap="round" />
      {/* Needle */}
      <line x1={CX} y1={CY} x2={needleTip.x} y2={needleTip.y} stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      {/* Pivot */}
      <circle cx={CX} cy={CY} r="9" fill="white" />
      <circle cx={CX} cy={CY} r="5.5" fill={activeColor} />
    </svg>
  );
}

// ─── History bar ──────────────────────────────────────────────────────────────

function HistoryBar({ entry, isToday }: { entry: FearGreedEntry; isToday?: boolean }) {
  const color = stateColor(entry.value);
  const date = new Date(entry.timestamp * 1000);
  const label = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-20 rounded-lg bg-orange-100 dark:bg-orange-950/30 relative overflow-hidden flex items-end">
        <div
          className="w-full rounded-lg transition-all duration-700"
          style={{ height: `${entry.value}%`, backgroundColor: color, opacity: isToday ? 1 : 0.65 }}
        />
      </div>
      <span className="text-[11px] font-bold" style={{ color }}>{entry.value}</span>
      <span className={`text-[9px] text-muted-foreground ${isToday ? 'font-bold' : ''}`}>{label}</span>
    </div>
  );
}

// ─── Trend icon ────────────────────────────────────────────────────────────────

function TrendIcon({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff > 2) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (diff < -2) return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function FearGreedDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useFearGreedIndex();
  const { data: meterImages = {} } = useFearGreedMeterImages();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56 mx-auto rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="flex justify-center gap-2">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28 w-8 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-muted-foreground text-sm">Could not load Fear &amp; Greed Index.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  const { current, history } = data;
  const cfg = STATE_CONFIG[current.state];
  const yesterdayEntry = history[1];
  const customImage = meterImages[current.state];
  const emoji = STATE_DEFAULT_EMOJI[current.state];
  const activeColor = stateColor(current.value);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Bitcoin Fear &amp; Greed Index
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-orange-500"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Live · Updated daily ·{' '}
          <a
            href="https://alternative.me/crypto/fear-and-greed-index/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-orange-400 inline-flex items-center gap-0.5"
          >
            alternative.me
            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </a>
        </p>
      </div>

      {/* ── Main card — bright orange Bitcoin theme ── */}
      <div className="rounded-2xl border-2 border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 overflow-hidden shadow-lg shadow-orange-100 dark:shadow-orange-900/20">

        <div className="p-6 grid md:grid-cols-2 gap-6 items-center">

          {/* ── Left: gauge + emoji ── */}
          <div className="flex flex-col items-center gap-2">
            {/* Emoji / custom image */}
            {customImage ? (
              <img src={customImage} alt={cfg.label} className="w-24 h-24 object-contain drop-shadow-lg" />
            ) : (
              <span className="text-6xl leading-none drop-shadow-lg select-none">{emoji}</span>
            )}

            {/* Gauge */}
            <GaugeSvg value={current.value} state={current.state} />
          </div>

          {/* ── Right: number, label, trend ── */}
          <div className="space-y-4 text-center md:text-left">

            {/* Big number */}
            <div>
              <p
                className="text-7xl font-black tabular-nums leading-none"
                style={{ color: activeColor }}
              >
                {current.value}
                <span className="text-3xl font-semibold text-muted-foreground">/100</span>
              </p>
            </div>

            {/* State badge */}
            <span
              className="inline-block px-4 py-1.5 rounded-full text-base font-black text-white shadow"
              style={{ backgroundColor: activeColor }}
            >
              {cfg.label}
            </span>

            {/* Yesterday */}
            {yesterdayEntry && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <TrendIcon current={current.value} previous={yesterdayEntry.value} />
                <span className="text-sm text-muted-foreground">
                  Yesterday: <span className="font-bold text-foreground">{yesterdayEntry.value}</span>
                  <span className="text-xs ml-1">({STATE_LABELS[yesterdayEntry.state]})</span>
                </span>
              </div>
            )}

            {/* Interpretation */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.state === 'extreme-fear' && 'Bitcoin holders are extremely fearful — historically one of the best times to accumulate.'}
              {current.state === 'fear' && 'Fear dominates — Bitcoin sentiment is bearish. Those who stay patient are often rewarded.'}
              {current.state === 'neutral' && 'Bitcoin sentiment is balanced. A calm market often precedes the next big move.'}
              {current.state === 'greed' && 'Greed is building — Bitcoin may be overheating short-term. Stay focused on the long game.'}
              {current.state === 'extreme-greed' && 'Extreme greed! Bitcoin latecomers may be piling in. A pullback is possible — zoom out.'}
            </p>

            {/* Scale legend */}
            <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
              {([
                ['#ef4444', '0–24', 'Extreme Fear'],
                ['#f97316', '25–44', 'Fear'],
                ['#eab308', '45–55', 'Neutral'],
                ['#84cc16', '56–74', 'Greed'],
                ['#22c55e', '75–100', 'Extreme Greed'],
              ] as [string, string, string][]).map(([col, range, lbl]) => (
                <div key={lbl} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                  <span style={{ color: col === '#eab308' ? undefined : undefined }}>{range} — {lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 7-day history strip ── */}
        {history.length > 1 && (
          <div className="px-6 pb-6">
            <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-3 text-center">
              7-Day Snapshot
            </p>
            <div className="flex items-end justify-center gap-2.5">
              {[...history].reverse().map((entry, i) => (
                <HistoryBar
                  key={entry.timestamp}
                  entry={entry}
                  isToday={i === history.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── What is the Bitcoin F&G Index ── */}
      <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 p-5 text-sm space-y-2">
        <p className="font-black text-base text-foreground flex items-center gap-2">
          <span>₿</span> What is the Bitcoin Fear &amp; Greed Index?
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The Bitcoin Fear &amp; Greed Index measures market sentiment on a scale of <strong>0 (Extreme Fear)</strong> to <strong>100 (Extreme Greed)</strong>.
          It combines Bitcoin price volatility, momentum, social media signals, market dominance, and Google search trends to give you a single number that reflects how the Bitcoin market feels right now.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Warren Buffett's timeless principle applies: <em className="text-foreground font-medium">"Be fearful when others are greedy, and greedy when others are fearful."</em>
        </p>
      </div>
    </div>
  );
}

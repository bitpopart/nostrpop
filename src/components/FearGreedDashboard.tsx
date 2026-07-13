import { useFearGreedIndex, STATE_DEFAULT_EMOJI, STATE_LABELS } from '@/hooks/useFearGreedIndex';
import type { FearGreedEntry, FearGreedState } from '@/hooks/useFearGreedIndex';
import { useFearGreedMeterImages } from '@/hooks/useFearGreedMeter';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Minus, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATE_LABELS_MAP: Record<FearGreedState, string> = {
  'extreme-fear':  'Extreme Fear',
  'fear':          'Fear',
  'neutral':       'Neutral',
  'greed':         'Greed',
  'extreme-greed': 'Extreme Greed',
};

/** Map a 0-100 value to a hex colour */
function valueColor(v: number): string {
  if (v <= 24) return '#ef4444';   // red   – Extreme Fear
  if (v <= 44) return '#f97316';   // orange – Fear
  if (v <= 55) return '#eab308';   // yellow – Neutral
  if (v <= 74) return '#84cc16';   // lime  – Greed
  return '#22c55e';                // green – Extreme Greed
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
//
// The half-circle spans from 180° (left = Extreme Fear) to 0° (right = Extreme Greed).
// Standard SVG angles: 0° = 3 o'clock, angles increase clockwise.
// We use the unit-circle convention via Math.cos/sin:
//   angle 180° → left  (Extreme Fear)
//   angle  90° → top   (Neutral, midpoint)
//   angle   0° → right (Extreme Greed)
//
// For a value V (0–100):
//   angleDeg = 180 - V * 1.8   (maps 0→180°, 100→0°)
//
// SVG point on arc: x = CX + R·cos(angleRad), y = CY - R·sin(angleRad)
// (subtract sin because SVG y-axis goes down)

function GaugeSvg({ value }: { value: number }) {
  const W = 260, H = 148;
  const CX = W / 2;   // 130
  const CY = H - 10;  // 138  — pivot sits near the bottom
  const R  = 108;
  const SW = 22;      // stroke width of the arc track

  // Convert degrees to SVG point on the arc circle
  function pt(deg: number, r = R) {
    const rad = (deg * Math.PI) / 180;
    return {
      x: CX + r * Math.cos(rad),
      y: CY - r * Math.sin(rad),
    };
  }

  // Draw an arc from angle a1 → a2.
  // Our angles go 180° (left) → 0° (right), decreasing.
  // In SVG: x = CX + R·cos, y = CY - R·sin, so going from 180°→0° means
  // x increases left→right and y traces the TOP of the circle.
  // sweep-flag=1 = clockwise in SVG screen space = correct top half-circle.
  function arcPath(a1: number, a2: number, r = R) {
    const p1 = pt(a1, r);
    const p2 = pt(a2, r);
    const large = Math.abs(a1 - a2) > 180 ? 1 : 0;
    // sweep-flag 1 = clockwise = top semicircle when going from left-point to right-point
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  // The 5 colour zones, each 36° wide, left→right = Fear→Greed
  // Extreme Fear: 180°→144°, Fear: 144°→108°, Neutral: 108°→72°, Greed: 72°→36°, Extreme Greed: 36°→0°
  const zones = [
    { from: 180, to: 144, color: '#ef4444' }, // Extreme Fear
    { from: 144, to: 108, color: '#f97316' }, // Fear
    { from: 108, to:  72, color: '#eab308' }, // Neutral
    { from:  72, to:  36, color: '#84cc16' }, // Greed
    { from:  36, to:   0, color: '#22c55e' }, // Extreme Greed
  ];

  // Needle angle: value 0 → 180° (extreme left), value 100 → 0° (extreme right)
  const needleDeg = 180 - value * 1.8;
  const needleTip = pt(needleDeg, R - 6);
  const color = valueColor(value);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[280px] mx-auto"
      style={{ overflow: 'visible' }}
    >
      {/* ── Grey track background — single full half-circle ── */}
      <path
        d={arcPath(180, 0)}
        fill="none"
        stroke="#d1d5db"
        strokeWidth={SW}
        strokeLinecap="butt"
        opacity="0.4"
      />

      {/* ── Coloured zone segments — butt caps so they tile flush ── */}
      {zones.map((z, i) => (
        <path
          key={i}
          d={arcPath(z.from, z.to)}
          fill="none"
          stroke={z.color}
          strokeWidth={SW}
          opacity="0.28"
          strokeLinecap="butt"
        />
      ))}

      {/* ── Active arc: from 180° (left) up to needle angle — on top of dim zones ── */}
      {value > 0 && (
        <path
          d={arcPath(180, needleDeg)}
          fill="none"
          stroke={color}
          strokeWidth={SW}
          strokeLinecap="round"
          opacity="1"
        />
      )}

      {/* ── Zone end-cap labels ── */}
      {/* "Extreme Fear" bottom-left */}
      <text x={pt(180).x + 4} y={CY + 16} fontSize="8.5" fontWeight="700" fill="#ef4444" opacity="0.85">Extreme</text>
      <text x={pt(180).x + 4} y={CY + 26} fontSize="8.5" fontWeight="700" fill="#ef4444" opacity="0.85">Fear</text>
      {/* "Neutral" top-centre */}
      <text x={CX} y={CY - R - SW / 2 - 6} fontSize="8.5" fontWeight="700" fill="#eab308" opacity="0.85" textAnchor="middle">Neutral</text>
      {/* "Extreme Greed" bottom-right */}
      <text x={pt(0).x - 4} y={CY + 16} fontSize="8.5" fontWeight="700" fill="#22c55e" opacity="0.85" textAnchor="end">Extreme</text>
      <text x={pt(0).x - 4} y={CY + 26} fontSize="8.5" fontWeight="700" fill="#22c55e" opacity="0.85" textAnchor="end">Greed</text>

      {/* ── Needle shadow ── */}
      <line
        x1={CX} y1={CY}
        x2={needleTip.x + 1.5} y2={needleTip.y + 1.5}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* ── Needle ── */}
      <line
        x1={CX} y1={CY}
        x2={needleTip.x} y2={needleTip.y}
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* ── Pivot ── */}
      <circle cx={CX} cy={CY} r="10" fill="white" />
      <circle cx={CX} cy={CY} r="6"  fill={color} />
    </svg>
  );
}

// ─── History bar ──────────────────────────────────────────────────────────────

function HistoryBar({ entry, isToday }: { entry: FearGreedEntry; isToday?: boolean }) {
  const color = valueColor(entry.value);
  const date  = new Date(entry.timestamp * 1000);
  const label = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-20 rounded-lg bg-orange-100 dark:bg-orange-950/40 relative overflow-hidden flex items-end">
        <div
          className="w-full rounded-lg transition-all duration-700"
          style={{ height: `${entry.value}%`, backgroundColor: color, opacity: isToday ? 1 : 0.6 }}
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
  if (diff > 2)  return <TrendingUp   className="h-4 w-4 text-green-500" />;
  if (diff < -2) return <TrendingDown className="h-4 w-4 text-red-400"   />;
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
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    );
  }

  const { current, history } = data;
  const yesterdayEntry = history[1];
  const customImage    = meterImages[current.state];
  const emoji          = STATE_DEFAULT_EMOJI[current.state];
  const color          = valueColor(current.value);
  const label          = STATE_LABELS_MAP[current.state];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Bitcoin Fear &amp; Greed Index
          </h2>
          <Button
            variant="ghost" size="icon"
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
            alternative.me <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </a>
        </p>
      </div>

      {/* ── Main card ── */}
      <div className="rounded-2xl border-2 border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 overflow-hidden shadow-lg shadow-orange-100 dark:shadow-orange-900/20">

        <div className="p-6 grid md:grid-cols-2 gap-6 items-center">

          {/* ── Left: emoji + gauge ── */}
          <div className="flex flex-col items-center gap-3">
            {customImage
              ? <img src={customImage} alt={label} className="w-24 h-24 object-contain drop-shadow-lg" />
              : <span className="text-6xl leading-none drop-shadow-lg select-none">{emoji}</span>
            }
            <GaugeSvg value={current.value} />
          </div>

          {/* ── Right: number, badge, trend, text ── */}
          <div className="space-y-4 text-center md:text-left">

            {/* Big number */}
            <p className="text-7xl font-black tabular-nums leading-none" style={{ color }}>
              {current.value}
              <span className="text-3xl font-semibold text-muted-foreground">/100</span>
            </p>

            {/* State pill */}
            <span
              className="inline-block px-4 py-1.5 rounded-full text-base font-black text-white shadow"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>

            {/* Yesterday trend */}
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
              {current.state === 'extreme-fear'  && 'Bitcoin holders are extremely fearful — historically one of the best times to accumulate.'}
              {current.state === 'fear'           && 'Fear dominates — Bitcoin sentiment is bearish. Those who stay patient are often rewarded.'}
              {current.state === 'neutral'        && 'Bitcoin sentiment is balanced. A calm market often precedes the next big move.'}
              {current.state === 'greed'          && 'Greed is building — Bitcoin may be overheating short-term. Stay focused on the long game.'}
              {current.state === 'extreme-greed'  && 'Extreme greed! Bitcoin latecomers may be piling in. A pullback is possible — zoom out.'}
            </p>

            {/* Scale legend */}
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {([
                ['#ef4444', '0–24',    'Extreme Fear'],
                ['#f97316', '25–44',   'Fear'],
                ['#eab308', '45–55',   'Neutral'],
                ['#84cc16', '56–74',   'Greed'],
                ['#22c55e', '75–100',  'Extreme Greed'],
              ] as [string, string, string][]).map(([col, range, lbl]) => (
                <div key={lbl} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                  {range} — {lbl}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 7-day history ── */}
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

      {/* ── Explainer ── */}
      <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 p-5 text-sm space-y-2">
        <p className="font-black text-base text-foreground flex items-center gap-2">
          <span>₿</span> What is the Bitcoin Fear &amp; Greed Index?
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The Bitcoin Fear &amp; Greed Index measures market sentiment on a scale of <strong>0 (Extreme Fear)</strong> to <strong>100 (Extreme Greed)</strong>.
          It combines Bitcoin price volatility, momentum, social media signals, market dominance, and Google search trends to give you a single number that reflects how the Bitcoin market feels right now.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Warren Buffett's timeless principle applies:{' '}
          <em className="text-foreground font-medium">"Be fearful when others are greedy, and greedy when others are fearful."</em>
        </p>
      </div>
    </div>
  );
}

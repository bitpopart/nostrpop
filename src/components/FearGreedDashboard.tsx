import { useFearGreedIndex, STATE_COLORS, STATE_DEFAULT_EMOJI, STATE_LABELS } from '@/hooks/useFearGreedIndex';
import type { FearGreedEntry, FearGreedState } from '@/hooks/useFearGreedIndex';
import { useFearGreedMeterImages } from '@/hooks/useFearGreedMeter';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Semicircular Gauge ────────────────────────────────────────────────────────

interface GaugeProps {
  value: number; // 0–100
  state: FearGreedState;
}

function GaugeSvg({ value, state }: GaugeProps) {
  const colors = STATE_COLORS[state];

  // Arc math — half-circle gauge
  const R = 90;
  const CX = 110;
  const CY = 108;

  // Convert 0–100 → angle on half circle (180° = 0, 0° = 100)
  const angle = 180 - (value / 100) * 180; // degrees from left
  const rad = (angle * Math.PI) / 180;
  const needleX = CX + R * Math.cos(rad);
  const needleY = CY - R * Math.sin(rad);

  // Zone colours (left to right: red → orange → yellow → lime → green)
  const zones = [
    { from: 180, to: 144, color: '#ef4444' },   // 0–20 extreme fear
    { from: 144, to: 108, color: '#f97316' },   // 20–40 fear
    { from: 108, to: 72, color: '#eab308' },    // 40–60 neutral
    { from: 72, to: 36, color: '#84cc16' },     // 60–80 greed
    { from: 36, to: 0, color: '#22c55e' },      // 80–100 extreme greed
  ];

  function arcPath(startDeg: number, endDeg: number) {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg * Math.PI) / 180;
    const x1 = CX + R * Math.cos(Math.PI - s);
    const y1 = CY - R * Math.sin(Math.PI - s);
    const x2 = CX + R * Math.cos(Math.PI - e);
    const y2 = CY - R * Math.sin(Math.PI - e);
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
  }

  return (
    <svg viewBox="0 0 220 125" className="w-full max-w-xs mx-auto">
      {/* Track background */}
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="18"
        className="text-muted-foreground/10"
        strokeLinecap="round"
      />

      {/* Coloured zone arcs */}
      {zones.map((z, i) => (
        <path
          key={i}
          d={arcPath(z.from, z.to)}
          fill="none"
          stroke={z.color}
          strokeWidth="18"
          strokeLinecap={i === 0 ? 'round' : i === zones.length - 1 ? 'round' : 'butt'}
          opacity="0.35"
        />
      ))}

      {/* Active filled arc from left end (extreme fear) to current value */}
      {value > 0 && (
        <path
          d={arcPath(180, 180 - (value / 100) * 180)}
          fill="none"
          stroke={
            state === 'extreme-fear' ? '#ef4444'
            : state === 'fear' ? '#f97316'
            : state === 'neutral' ? '#eab308'
            : state === 'greed' ? '#84cc16'
            : '#22c55e'
          }
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* Zone labels */}
      <text x="14" y={CY + 18} fontSize="8" fill="#ef4444" fontWeight="600" opacity="0.8">Extreme<tspan x="10" dy="9">Fear</tspan></text>
      <text x={CX - 8} y="14" fontSize="8" fill="#eab308" fontWeight="600" opacity="0.8" textAnchor="middle">Neutral</text>
      <text x={CX * 2 - 8} y={CY + 18} fontSize="8" fill="#22c55e" fontWeight="600" opacity="0.8" textAnchor="end">Extreme<tspan x={CX * 2 - 8} dy="9">Greed</tspan></text>

      {/* Needle */}
      <line
        x1={CX}
        y1={CY}
        x2={needleX}
        y2={needleY}
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* Needle pivot */}
      <circle cx={CX} cy={CY} r="7" fill="white" opacity="0.95" />
      <circle cx={CX} cy={CY} r="4" fill={
        state === 'extreme-fear' ? '#ef4444'
        : state === 'fear' ? '#f97316'
        : state === 'neutral' ? '#eab308'
        : state === 'greed' ? '#84cc16'
        : '#22c55e'
      } />

      {/* Value text */}
      <text
        x={CX}
        y={CY - 18}
        textAnchor="middle"
        fontSize="26"
        fontWeight="900"
        fill="white"
        opacity="0.95"
      >
        {value}
      </text>
    </svg>
  );
}

// ─── History mini-bar ──────────────────────────────────────────────────────────

interface HistoryBarProps {
  entry: FearGreedEntry;
  isToday?: boolean;
}

function HistoryBar({ entry, isToday }: HistoryBarProps) {
  const colors = STATE_COLORS[entry.state];
  const date = new Date(entry.timestamp * 1000);
  const label = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

  const barColor =
    entry.state === 'extreme-fear' ? 'bg-red-500'
    : entry.state === 'fear' ? 'bg-orange-500'
    : entry.state === 'neutral' ? 'bg-yellow-500'
    : entry.state === 'greed' ? 'bg-lime-500'
    : 'bg-green-500';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* bar */}
      <div className="w-7 h-20 rounded-md bg-muted/30 relative overflow-hidden flex items-end">
        <div
          className={`w-full rounded-md transition-all duration-700 ${barColor}`}
          style={{ height: `${entry.value}%`, opacity: isToday ? 1 : 0.6 }}
        />
      </div>
      {/* value */}
      <span className={`text-[10px] font-bold ${colors.text}`}>{entry.value}</span>
      {/* day */}
      <span className={`text-[9px] text-muted-foreground ${isToday ? 'font-bold' : ''}`}>{label}</span>
    </div>
  );
}

// ─── Trend icon ────────────────────────────────────────────────────────────────

function TrendIcon({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff > 2) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (diff < -2) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function FearGreedDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useFearGreedIndex();
  const { data: meterImages = {} } = useFearGreedMeterImages();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-sm mx-auto text-center py-8 space-y-3">
        <p className="text-muted-foreground text-sm">Could not load Fear &amp; Greed Index.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  const { current, history } = data;
  const colors = STATE_COLORS[current.state];
  const yesterdayEntry = history[1];
  const customImage = meterImages[current.state];
  const emoji = STATE_DEFAULT_EMOJI[current.state];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl font-black tracking-tight">Bitcoin Fear &amp; Greed Index</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Live from{' '}
          <a
            href="https://alternative.me/crypto/fear-and-greed-index/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-orange-400 inline-flex items-center gap-0.5"
          >
            alternative.me
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          {' '}· Updated daily
        </p>
      </div>

      {/* ── Main card ── */}
      <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 grid md:grid-cols-2 gap-6 items-center`}>

        {/* Left: Gauge + emoji image */}
        <div className="flex flex-col items-center gap-4">
          {/* Emoji / custom image */}
          <div className="relative">
            {customImage ? (
              <img
                src={customImage}
                alt={STATE_LABELS[current.state]}
                className="w-28 h-28 object-contain drop-shadow-lg"
              />
            ) : (
              <span className="text-7xl leading-none drop-shadow-lg select-none">{emoji}</span>
            )}
          </div>

          {/* Gauge */}
          <div className="w-full">
            <GaugeSvg value={current.value} state={current.state} />
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-4 text-center md:text-left">
          {/* Big label */}
          <div>
            <Badge className={`text-sm font-bold px-4 py-1.5 border-0 bg-gradient-to-r ${colors.gradient} text-white shadow mb-2`}>
              {STATE_LABELS[current.state]}
            </Badge>
            <p className="text-5xl font-black mt-2 tabular-nums" style={{
              background: current.state === 'extreme-fear' ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                : current.state === 'fear' ? 'linear-gradient(135deg,#f97316,#ea580c)'
                : current.state === 'neutral' ? 'linear-gradient(135deg,#eab308,#ca8a04)'
                : current.state === 'greed' ? 'linear-gradient(135deg,#84cc16,#65a30d)'
                : 'linear-gradient(135deg,#22c55e,#16a34a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {current.value}
              <span className="text-2xl font-semibold">/100</span>
            </p>
          </div>

          {/* Yesterday comparison */}
          {yesterdayEntry && (
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <TrendIcon current={current.value} previous={yesterdayEntry.value} />
              <span className="text-sm text-muted-foreground">
                Yesterday: <span className="font-semibold text-foreground">{yesterdayEntry.value}</span>
                {' '}({STATE_LABELS[yesterdayEntry.state]})
              </span>
            </div>
          )}

          {/* Interpretation */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {current.state === 'extreme-fear' && 'Investors are extremely fearful — historically a potential buying opportunity.'}
            {current.state === 'fear' && 'Fear dominates the market — sentiment is bearish. Patience may be rewarded.'}
            {current.state === 'neutral' && 'The market is balanced between fear and greed. Proceed with a clear strategy.'}
            {current.state === 'greed' && 'Greed is rising — markets may be overheating. Consider taking profits carefully.'}
            {current.state === 'extreme-greed' && 'Extreme greed! Markets may be due for a correction. Caution is advised.'}
          </p>

          {/* Scale guide */}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />0–24 Extreme Fear</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />25–44 Fear</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />45–55 Neutral</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-lime-500 inline-block" />56–74 Greed</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />75–100 Extreme Greed</div>
          </div>
        </div>
      </div>

      {/* ── 7-day history bars ── */}
      {history.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 text-center">7-Day History</p>
          <div className="flex items-end justify-center gap-2">
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

      {/* ── What is F&G ── */}
      <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10 p-4 text-sm">
        <p className="font-bold text-foreground mb-1">What is the Fear &amp; Greed Index?</p>
        <p className="text-muted-foreground leading-relaxed">
          The Crypto Fear &amp; Greed Index measures market sentiment on a scale of 0 (Extreme Fear) to 100 (Extreme Greed).
          It aggregates volatility, market momentum, social media, surveys, Bitcoin dominance, and search trends.
          Warren Buffett's famous saying applies: <em>"Be fearful when others are greedy and greedy when others are fearful."</em>
        </p>
      </div>
    </div>
  );
}

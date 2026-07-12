import { useQuery } from '@tanstack/react-query';

const MEMPOOL_API = 'https://mempool.space/api';
const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

export interface BitcoinBlock {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  difficulty: number;
  extras?: {
    pool?: {
      name: string;
      slug: string;
    };
    totalFees?: number;
    reward?: number;
    medianFee?: number;
  };
}

function mempoolUrl(path: string) {
  return `${CORS_PROXY}${encodeURIComponent(`${MEMPOOL_API}${path}`)}`;
}

/** Fetch the last N Bitcoin blocks from mempool.space */
export function useRecentBlocks(count = 20) {
  return useQuery<BitcoinBlock[]>({
    queryKey: ['bitcoin-blocks', count],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      const res = await fetch(mempoolUrl('/v1/blocks'), { signal });
      if (!res.ok) throw new Error(`mempool.space error: ${res.status}`);
      const data: BitcoinBlock[] = await res.json();
      return data.slice(0, count);
    },
    staleTime: 60_000,          // treat fresh for 1 min
    refetchInterval: 60_000,    // auto-refresh every minute
    retry: 2,
  });
}

/** Fetch the latest (tip) block height */
export function useTipHeight() {
  return useQuery<number>({
    queryKey: ['bitcoin-tip-height'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const res = await fetch(mempoolUrl('/blocks/tip/height'), { signal });
      if (!res.ok) throw new Error(`mempool.space error: ${res.status}`);
      const text = await res.text();
      return parseInt(text.trim(), 10);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 2,
  });
}

// ─── Canvas Block Art Generator ──────────────────────────────────────────────

/** Colour palette inspired by Bitcoin orange + pop-art */
const PALETTES = [
  { bg: '#f7931a', accent: '#ffffff', text: '#1a1a1a', border: '#ff6b00' },     // Bitcoin Orange
  { bg: '#1a1a2e', accent: '#f7931a', text: '#ffffff', border: '#e94560' },     // Dark Bitcoin
  { bg: '#e94560', accent: '#f7931a', text: '#ffffff', border: '#1a1a2e' },     // Pop Red
  { bg: '#0f3460', accent: '#e94560', text: '#ffffff', border: '#f7931a' },     // Deep Blue
  { bg: '#f5f0e8', accent: '#f7931a', text: '#1a1a1a', border: '#d4a017' },     // Cream Bitcoin
  { bg: '#2d1b69', accent: '#ff6b6b', text: '#ffffff', border: '#f7931a' },     // Purple Night
  { bg: '#1a3a1a', accent: '#00ff41', text: '#00ff41', border: '#f7931a' },     // Matrix Green
  { bg: '#ff1493', accent: '#ffffff', text: '#1a1a1a', border: '#f7931a' },     // Pop Pink
];

/** Get a deterministic palette index based on block height */
function getPalette(height: number) {
  return PALETTES[height % PALETTES.length];
}

/** Helper: draw a halftone dot pattern */
function drawHalftone(ctx: CanvasRenderingContext2D, color: string, size: number) {
  ctx.fillStyle = color;
  const spacing = size / 14;
  const dotR = spacing * 0.3;
  for (let x = spacing; x < size; x += spacing) {
    for (let y = spacing; y < size; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Generate a BitPopArt–style block image on the given canvas */
export function generateBlockArt(canvas: HTMLCanvasElement, block: BitcoinBlock): string {
  const S = 1080; // 1:1 square
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const pal = getPalette(block.height);

  // ── Background
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, S, S);

  // ── Halftone overlay
  ctx.globalAlpha = 0.12;
  drawHalftone(ctx, pal.accent, S);
  ctx.globalAlpha = 1;

  // ── Thick border frame (pop-art style)
  const bw = 18;
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, S - bw, S - bw);

  // ── Inner double border
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(bw + 10, bw + 10, S - (bw + 10) * 2, S - (bw + 10) * 2);

  // ── Big ₿ symbol (stylised, behind everything)
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = pal.accent;
  ctx.font = `bold ${S * 0.72}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₿', S / 2, S / 2 + 30);
  ctx.globalAlpha = 1;

  // ── Top label strip
  const stripH = 90;
  ctx.fillStyle = pal.border;
  ctx.fillRect(bw, bw, S - bw * 2, stripH);
  ctx.fillStyle = pal.accent;
  ctx.font = `bold ${stripH * 0.42}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BITCOIN BLOCK', S / 2, bw + stripH / 2);

  // ── Centre: giant block number
  const numFontSize = Math.min(S * 0.22, 220);
  ctx.fillStyle = pal.text;
  ctx.font = `900 ${numFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow glow
  ctx.shadowColor = pal.accent;
  ctx.shadowBlur = 28;
  ctx.fillText(`#${block.height.toLocaleString()}`, S / 2, S / 2 - 30);
  ctx.shadowBlur = 0;

  // ── Mini hash (bottom-centre, truncated)
  const hashShort = `${block.id.slice(0, 8)}…${block.id.slice(-8)}`;
  ctx.fillStyle = pal.accent;
  ctx.font = `400 ${S * 0.028}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hashShort, S / 2, S / 2 + numFontSize * 0.62);

  // ── Stats row
  const statsY = S * 0.72;
  const statFontSize = S * 0.034;
  ctx.font = `600 ${statFontSize}px sans-serif`;
  ctx.fillStyle = pal.text;

  const txLabel = `${block.tx_count.toLocaleString()} txs`;
  const feeLabel = block.extras?.totalFees
    ? `${(block.extras.totalFees / 100_000_000).toFixed(4)} BTC fees`
    : '';
  const poolLabel = block.extras?.pool?.name ?? '';

  ctx.textAlign = 'left';
  ctx.fillText(txLabel, bw + 30, statsY);

  if (feeLabel) {
    ctx.textAlign = 'center';
    ctx.fillText(feeLabel, S / 2, statsY);
  }

  if (poolLabel) {
    ctx.textAlign = 'right';
    ctx.fillText(poolLabel, S - bw - 30, statsY);
  }

  // ── Timestamp
  const dt = new Date(block.timestamp * 1000).toUTCString().slice(0, 25);
  ctx.fillStyle = pal.accent;
  ctx.font = `400 ${S * 0.026}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(dt, S / 2, statsY + statFontSize + 12);

  // ── Bottom strip with BitPopArt branding
  const botStripH = 70;
  ctx.fillStyle = pal.border;
  ctx.fillRect(bw, S - bw - botStripH, S - bw * 2, botStripH);
  ctx.fillStyle = pal.accent;
  ctx.font = `bold ${botStripH * 0.36}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('bitpopart.com  ⚡  Nostr', S / 2, S - bw - botStripH / 2);

  return canvas.toDataURL('image/png');
}

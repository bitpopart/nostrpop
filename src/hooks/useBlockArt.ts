import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNFTCharacters, type NFTCharacter, type NFTLayerGroup } from './useNFTCharacters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

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
    staleTime: 60_000,
    refetchInterval: 60_000,
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

// ─── Block Character (admin-uploaded layers) ─────────────────────────────────

/**
 * Returns the NFT character with category "block" published by the admin.
 * This is the "Block character" — its layers are used to compose the block art.
 */
export function useBlockCharacter(): {
  character: NFTCharacter | null;
  isLoading: boolean;
} {
  const { data: characters, isLoading } = useNFTCharacters();
  const character = characters?.find(c => c.category === 'block') ?? null;
  return { character, isLoading };
}

// ─── Seeded pseudo-random (deterministic per block height + seed) ─────────────

function seededRand(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

/**
 * Pick one variant URL per layer group, using the block height as the RNG seed.
 * This ensures:
 *   - The same block always produces the SAME image (deterministic)
 *   - Different blocks almost always produce DIFFERENT images
 *
 * The seed mixes block height + block id hash for extra entropy.
 */
export function pickLayersForBlock(
  groups: NFTLayerGroup[],
  block: BitcoinBlock,
): string[] {
  // Mix block height with first 8 hex chars of the block id for more entropy
  const idNum = parseInt(block.id.slice(-8), 16) || 0;
  const seed = (block.height * 2654435761) ^ idNum;
  const rand = seededRand(seed);

  return groups.map(g => {
    const valid = g.variants.filter(Boolean);
    if (valid.length === 0) return '';
    const idx = Math.floor(rand() * valid.length);
    return valid[idx];
  }).filter(Boolean);
}

// ─── Canvas Block Art Generator ──────────────────────────────────────────────

/** Colour palette inspired by Bitcoin orange + pop-art */
const PALETTES = [
  { bg: '#f7931a', accent: '#ffffff', text: '#1a1a1a', border: '#cc6600' },     // Bitcoin Orange
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

/**
 * Load an image from a URL into an HTMLImageElement.
 * Handles both http(s) URLs and data: URLs.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    // Only set crossOrigin for actual http/https URLs to avoid CORS errors on data URLs
    if (src.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Failed to load: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

/**
 * Overlay the block-info text on a canvas that already has the character layers drawn.
 * Call AFTER the character layers have been composited.
 */
function overlayBlockInfo(
  ctx: CanvasRenderingContext2D,
  S: number,
  block: BitcoinBlock,
  pal: typeof PALETTES[0],
) {
  const bw = 18;

  // ── Halftone overlay (subtle)
  ctx.globalAlpha = 0.07;
  drawHalftone(ctx, pal.accent, S);
  ctx.globalAlpha = 1;

  // ── Outer border
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, S - bw, S - bw);

  // ── Inner accent border
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(bw + 8, bw + 8, S - (bw + 8) * 2, S - (bw + 8) * 2);

  // ── Top strip — "BITCOIN BLOCK"
  const stripH = 80;
  ctx.fillStyle = pal.border;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(bw, bw, S - bw * 2, stripH);
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal.accent;
  ctx.font = `bold ${stripH * 0.44}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BITCOIN BLOCK', S / 2, bw + stripH / 2);

  // ── Mini hash (centered)
  const hashShort = `${block.id.slice(0, 10)}…${block.id.slice(-10)}`;
  ctx.fillStyle = pal.accent;
  ctx.font = `400 ${S * 0.024}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(hashShort, S / 2, S * 0.55);

  // ── Bottom strip
  const botH = 90;
  const botY = S - bw - botH;
  ctx.fillStyle = pal.border;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(bw, botY, S - bw * 2, botH);
  ctx.globalAlpha = 1;

  // Stats inside bottom strip
  const statFont = `600 ${S * 0.028}px sans-serif`;
  ctx.font = statFont;
  ctx.fillStyle = pal.accent;
  ctx.textBaseline = 'middle';
  const midBot = botY + botH / 2;

  const txLabel = `${block.tx_count.toLocaleString()} txs`;
  const poolLabel = block.extras?.pool?.name ?? '';
  const feeLabel = block.extras?.totalFees
    ? `${(block.extras.totalFees / 100_000_000).toFixed(4)} ₿ fees`
    : '';

  ctx.textAlign = 'left';
  ctx.fillText(txLabel, bw + 20, midBot - S * 0.014);

  if (feeLabel) {
    ctx.textAlign = 'center';
    ctx.fillText(feeLabel, S / 2, midBot - S * 0.014);
  }

  if (poolLabel) {
    ctx.textAlign = 'right';
    ctx.fillText(poolLabel, S - bw - 20, midBot - S * 0.014);
  }

  // Timestamp sub-line
  const dt = new Date(block.timestamp * 1000).toUTCString().slice(0, 25);
  ctx.font = `400 ${S * 0.022}px monospace`;
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.75;
  ctx.textAlign = 'center';
  ctx.fillText(dt, S / 2, midBot + S * 0.018);
  ctx.globalAlpha = 1;

  // ── "bitpopart.com ⚡ Nostr" micro-brand
  ctx.font = `bold ${S * 0.018}px sans-serif`;
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('bitpopart.com  ⚡  Nostr', S / 2, S - bw - 6);
  ctx.globalAlpha = 1;
}

/**
 * Composite character layers + block-info overlay onto the canvas.
 *
 * If layerUrls is provided (admin layers), they are drawn first; then the
 * block-info text is overlaid on top.
 *
 * If no layers are available, falls back to the plain block-info canvas.
 */
export async function generateBlockArtWithLayers(
  canvas: HTMLCanvasElement,
  block: BitcoinBlock,
  layerUrls: string[],   // admin layer images (already picked for this block)
): Promise<string> {
  const S = 1080;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const pal = getPalette(block.height);

  // ── Background fill
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, S, S);

  if (layerUrls.length > 0) {
    // ── Draw each character layer, bottom → top
    for (const url of layerUrls) {
      try {
        const img = await loadImage(url);
        ctx.drawImage(img, 0, 0, S, S);
      } catch {
        // skip broken layer
      }
    }
  } else {
    // ── Fallback: big faint ₿ ghost
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = pal.accent;
    ctx.font = `bold ${S * 0.72}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₿', S / 2, S / 2 + 30);
    ctx.globalAlpha = 1;
  }

  // ── Overlay block info on top of everything
  overlayBlockInfo(ctx, S, block, pal);

  return canvas.toDataURL('image/png');
}

/**
 * Synchronous fallback: generates the plain block-info canvas (no image loading).
 * Used for immediate skeleton rendering before async layers finish.
 */
export function generateBlockArt(canvas: HTMLCanvasElement, block: BitcoinBlock): string {
  const S = 1080;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const pal = getPalette(block.height);

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, S, S);

  // Big ghost ₿
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = pal.accent;
  ctx.font = `bold ${S * 0.72}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₿', S / 2, S / 2 + 30);
  ctx.globalAlpha = 1;

  overlayBlockInfo(ctx, S, block, pal);
  return canvas.toDataURL('image/png');
}

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

/** Fixed orange palette — all blocks use the Bitcoin orange frame */
const ORANGE_PALETTE = { bg: '#f7931a', accent: '#ffffff', text: '#ffffff', border: '#f7931a' };

/** Always returns the orange Bitcoin palette */
function getPalette(_height: number) {
  return ORANGE_PALETTE;
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
  pal: ReturnType<typeof getPalette>,
) {
  const bw = 18;

  // ── Halftone overlay (subtle)
  ctx.globalAlpha = 0.07;
  drawHalftone(ctx, pal.accent, S);
  ctx.globalAlpha = 1;

  // ── Outer orange border
  ctx.strokeStyle = '#f7931a';
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, S - bw, S - bw);

  // ── Inner white accent border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(bw + 8, bw + 8, S - (bw + 8) * 2, S - (bw + 8) * 2);

  // ── Top strip — "BITCOIN BLOCK"
  const stripH = 80;
  ctx.fillStyle = '#f7931a';
  ctx.globalAlpha = 1;
  ctx.fillRect(bw, bw, S - bw * 2, stripH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${stripH * 0.44}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BITCOIN BLOCK', S / 2, bw + stripH / 2);

  // ── Bottom strip — taller to fit 3 lines comfortably
  // Line 1: txs | fees | pool
  // Line 2: timestamp
  // Line 3: bitpopart.com ⚡ Nostr
  const botH = 120;
  const botY = S - bw - botH;
  ctx.fillStyle = '#f7931a';
  ctx.globalAlpha = 1;
  ctx.fillRect(bw, botY, S - bw * 2, botH);

  // Line 1 — stats (txs / fees / pool) — top third of strip
  const line1Y = botY + botH * 0.22;
  const statFont = `600 ${S * 0.028}px sans-serif`;
  ctx.font = statFont;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';

  const txLabel = `${block.tx_count.toLocaleString()} txs`;
  const poolLabel = block.extras?.pool?.name ?? '';
  const feeLabel = block.extras?.totalFees
    ? `${(block.extras.totalFees / 100_000_000).toFixed(4)} ₿ fees`
    : '';

  ctx.textAlign = 'left';
  ctx.fillText(txLabel, bw + 20, line1Y);

  if (feeLabel) {
    ctx.textAlign = 'center';
    ctx.fillText(feeLabel, S / 2, line1Y);
  }

  if (poolLabel) {
    ctx.textAlign = 'right';
    ctx.fillText(poolLabel, S - bw - 20, line1Y);
  }

  // Line 2 — timestamp — middle of strip
  const line2Y = botY + botH * 0.55;
  const dt = new Date(block.timestamp * 1000).toUTCString().slice(0, 25);
  ctx.font = `400 ${S * 0.022}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.fillText(dt, S / 2, line2Y);
  ctx.globalAlpha = 1;

  // Line 3 — "bitpopart.com ⚡ Nostr" — bottom of strip
  const line3Y = botY + botH * 0.84;
  ctx.font = `bold ${S * 0.018}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('bitpopart.com  ⚡  Nostr', S / 2, line3Y);
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

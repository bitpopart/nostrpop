/**
 * Animated GIF encoder — pure browser JS, no dependencies.
 * Produces valid GIF89a animated files with local color tables (256-color per frame).
 */

// ── Color quantization: 6×6×6 uniform cube → 216 entries, rest = black ───────

function buildPalette(): Uint8Array {
  const pal = new Uint8Array(256 * 3); // all zeros = black by default
  const L = 6;
  const S = 255 / (L - 1);
  for (let r = 0; r < L; r++) {
    for (let g = 0; g < L; g++) {
      for (let b = 0; b < L; b++) {
        const i = (r * L * L + g * L + b) * 3;
        pal[i]     = Math.round(r * S);
        pal[i + 1] = Math.round(g * S);
        pal[i + 2] = Math.round(b * S);
      }
    }
  }
  return pal;
}

const PALETTE = buildPalette();
const PAL_LEVELS = 6;
const PAL_STEP = 255 / (PAL_LEVELS - 1);

function nearestPaletteIdx(r: number, g: number, b: number): number {
  const ri = Math.round(r / PAL_STEP);
  const gi = Math.round(g / PAL_STEP);
  const bi = Math.round(b / PAL_STEP);
  return ri * PAL_LEVELS * PAL_LEVELS + gi * PAL_LEVELS + bi;
}

function quantizePixels(rgba: Uint8ClampedArray): Uint8Array {
  const n = rgba.length >>> 2;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = nearestPaletteIdx(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
  }
  return out;
}

// ── LZW encoder (GIF spec compliant) ─────────────────────────────────────────

function lzwEncode(pixels: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoi       = clearCode + 1;

  // Bit-packing output
  const bytes: number[] = [];
  let buf = 0, bits = 0;

  function writeBits(code: number, len: number) {
    buf |= code << bits;
    bits += len;
    while (bits >= 8) {
      bytes.push(buf & 0xff);
      buf >>= 8;
      bits -= 8;
    }
  }

  function flush() {
    if (bits > 0) { bytes.push(buf & 0xff); buf = 0; bits = 0; }
  }

  // Code table: key = prefix_index * 256 + suffix_byte → code number
  // Use a flat array for speed (max 4096 entries)
  let codeSize = minCodeSize + 1;
  let nextCode  = eoi + 1;
  let maxCode   = 1 << codeSize;

  // Using a Map with string keys is simplest for correctness
  const table = new Map<string, number>();

  function resetTable() {
    table.clear();
    nextCode = eoi + 1;
    codeSize = minCodeSize + 1;
    maxCode  = 1 << codeSize;
  }

  writeBits(clearCode, codeSize);

  let prefix = -1; // -1 = empty

  for (let i = 0; i < pixels.length; i++) {
    const k = pixels[i];
    if (prefix === -1) {
      prefix = k;
      continue;
    }
    const key = `${prefix},${k}`;
    const found = table.get(key);
    if (found !== undefined) {
      prefix = found;
    } else {
      writeBits(prefix, codeSize);
      if (nextCode < 4096) {
        table.set(key, nextCode++);
        if (nextCode > maxCode && codeSize < 12) {
          codeSize++;
          maxCode = 1 << codeSize;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetTable();
      }
      prefix = k;
    }
  }

  if (prefix !== -1) writeBits(prefix, codeSize);
  writeBits(eoi, codeSize);
  flush();

  return new Uint8Array(bytes);
}

// ── Sub-block packer (255-byte chunks) ───────────────────────────────────────

function packSubBlocks(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let off = 0;
  while (off < data.length) {
    const size = Math.min(255, data.length - off);
    out.push(size);
    for (let i = 0; i < size; i++) out.push(data[off + i]);
    off += size;
  }
  out.push(0); // block terminator
  return new Uint8Array(out);
}

// ── Writer helper ─────────────────────────────────────────────────────────────

class ByteWriter {
  private chunks: Uint8Array[] = [];
  private tmp: number[] = [];

  u8(v: number)  { this.tmp.push(v & 0xff); }
  u16le(v: number) { this.u8(v); this.u8(v >> 8); }
  bytes(arr: Uint8Array | number[]) {
    if (arr instanceof Uint8Array) {
      this.flush(); this.chunks.push(arr);
    } else {
      for (const b of arr) this.u8(b);
    }
  }
  str(s: string) { for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i)); }
  flush() {
    if (this.tmp.length) { this.chunks.push(new Uint8Array(this.tmp)); this.tmp = []; }
  }
  toBlob(type: string): Blob {
    this.flush();
    return new Blob(this.chunks, { type });
  }
}

// ── GifEncoder ────────────────────────────────────────────────────────────────

export class GifEncoder {
  private w: number;
  private h: number;
  private frameData: Array<{ pixels: Uint8Array; delayMs: number }> = [];

  constructor(width: number, height: number) {
    this.w = width;
    this.h = height;
  }

  /** Add a frame. `rgba` is a Uint8ClampedArray of width×height×4 bytes (from canvas.getImageData). */
  addFrame(rgba: Uint8ClampedArray, delayMs: number) {
    this.frameData.push({ pixels: quantizePixels(rgba), delayMs });
  }

  /** Encode all frames and return an animated GIF Blob. */
  finish(): Blob {
    const W = this.w, H = this.h;
    const out = new ByteWriter();

    // ── GIF Header ──────────────────────────────────────────────────────────
    out.str('GIF89a');
    out.u16le(W);
    out.u16le(H);
    // Packed byte: global color table present (1), color res=7, no sort, size=7 (2^8=256)
    out.u8(0xF7); // 1111 0111
    out.u8(0);    // background color index
    out.u8(0);    // pixel aspect ratio

    // Global Color Table (256 × 3 bytes) — same palette for all frames
    out.bytes(PALETTE);

    // ── Netscape looping extension ───────────────────────────────────────────
    out.u8(0x21); out.u8(0xFF); out.u8(0x0B); // Extension + size
    out.str('NETSCAPE2.0');
    out.u8(0x03); out.u8(0x01);
    out.u16le(0); // loop count = 0 (infinite)
    out.u8(0x00); // block terminator

    // ── Frames ───────────────────────────────────────────────────────────────
    for (const { pixels, delayMs } of this.frameData) {
      const delayCentis = Math.max(1, Math.round(delayMs / 10));

      // Graphic Control Extension
      out.u8(0x21); out.u8(0xF9); out.u8(0x04);
      out.u8(0x00); // disposal = 0 (do not dispose)
      out.u16le(delayCentis);
      out.u8(0);    // transparent color index (unused)
      out.u8(0x00); // block terminator

      // Image Descriptor (use global color table — no local)
      out.u8(0x2C);
      out.u16le(0); out.u16le(0); // left, top
      out.u16le(W); out.u16le(H);
      out.u8(0x00); // packed: no local CT, not interlaced

      // Image Data
      const minCodeSize = 8; // matches 256-color palette
      out.u8(minCodeSize);
      const lzwRaw = lzwEncode(pixels, minCodeSize);
      out.bytes(packSubBlocks(lzwRaw));
    }

    // ── Trailer ──────────────────────────────────────────────────────────────
    out.u8(0x3B);

    return out.toBlob('image/gif');
  }
}

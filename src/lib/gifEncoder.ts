/**
 * Minimal animated GIF encoder (browser-compatible, no dependencies)
 * Supports true-color images quantized to 256 colors via median-cut.
 * 
 * Usage:
 *   const encoder = new GifEncoder(width, height);
 *   encoder.addFrame(imageData, delayMs);
 *   encoder.addFrame(imageData2, delayMs);
 *   const blob = encoder.finish();
 */

// ── Color quantization (uniform 6x6x6 color cube for simplicity) ──────────────

function quantize(rgba: Uint8ClampedArray): { palette: Uint8Array; indexed: Uint8Array } {
  const n = rgba.length / 4;
  // Build a 216-color cube palette (6 levels per channel)
  const LEVELS = 6;
  const STEP = 255 / (LEVELS - 1);

  const palette = new Uint8Array(256 * 3);
  for (let r = 0; r < LEVELS; r++) {
    for (let g = 0; g < LEVELS; g++) {
      for (let b = 0; b < LEVELS; b++) {
        const idx = r * LEVELS * LEVELS + g * LEVELS + b;
        palette[idx * 3] = Math.round(r * STEP);
        palette[idx * 3 + 1] = Math.round(g * STEP);
        palette[idx * 3 + 2] = Math.round(b * STEP);
      }
    }
  }

  const indexed = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const ri = i * 4;
    const rv = rgba[ri];
    const gv = rgba[ri + 1];
    const bv = rgba[ri + 2];
    // Map to nearest cube color
    const ri2 = Math.round(rv / STEP);
    const gi2 = Math.round(gv / STEP);
    const bi2 = Math.round(bv / STEP);
    indexed[i] = ri2 * LEVELS * LEVELS + gi2 * LEVELS + bi2;
  }

  return { palette, indexed };
}

// ── LZW encoder ───────────────────────────────────────────────────────────────

function lzwEncode(indexed: Uint8Array, minCodeSize: number): Uint8Array {
  const output: number[] = [];
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;
  let nextCode = eofCode + 1;
  let codeSize = minCodeSize + 1;
  let maxCode = 1 << codeSize;
  let codeBuf = 0;
  let bitsFree = 0;

  function emit(code: number) {
    codeBuf |= code << bitsFree;
    bitsFree += codeSize;
    while (bitsFree >= 8) {
      output.push(codeBuf & 0xff);
      codeBuf >>= 8;
      bitsFree -= 8;
    }
  }

  const codeTable = new Map<string, number>();
  function resetTable() {
    codeTable.clear();
    nextCode = eofCode + 1;
    codeSize = minCodeSize + 1;
    maxCode = 1 << codeSize;
  }
  resetTable();

  emit(clearCode);

  let prefix = '';
  for (let i = 0; i < indexed.length; i++) {
    const k = String(indexed[i]);
    const pk = prefix + ',' + k;
    if (prefix === '' || codeTable.has(pk)) {
      prefix = pk === ',' + k && prefix === '' ? k : pk;
    } else {
      // emit prefix code
      const code = prefix.includes(',')
        ? codeTable.get(prefix)!
        : parseInt(prefix);
      emit(code);
      codeTable.set(pk, nextCode++);
      if (nextCode > maxCode && codeSize < 12) {
        codeSize++;
        maxCode = 1 << codeSize;
      }
      if (nextCode >= 4096) {
        emit(clearCode);
        resetTable();
      }
      prefix = k;
    }
  }

  if (prefix !== '') {
    const code = prefix.includes(',')
      ? (codeTable.has(prefix) ? codeTable.get(prefix)! : parseInt(prefix))
      : parseInt(prefix);
    emit(code);
  }

  emit(eofCode);
  if (bitsFree > 0) output.push(codeBuf & 0xff);

  return new Uint8Array(output);
}

// ── Sub-block chunking ────────────────────────────────────────────────────────

function toSubBlocks(data: Uint8Array): Uint8Array {
  const blocks: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    const size = Math.min(255, data.length - offset);
    blocks.push(size);
    for (let i = 0; i < size; i++) blocks.push(data[offset + i]);
    offset += size;
  }
  blocks.push(0); // block terminator
  return new Uint8Array(blocks);
}

// ── GifEncoder class ──────────────────────────────────────────────────────────

export class GifEncoder {
  private width: number;
  private height: number;
  private frames: Uint8Array[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /** Add a frame. imageData is the raw RGBA pixel array (width*height*4 bytes). delayMs is per-frame time in ms. */
  addFrame(imageData: Uint8ClampedArray, delayMs: number) {
    const { palette, indexed } = quantize(imageData);
    const minCodeSize = 8; // 256 colors
    const lzwData = lzwEncode(indexed, minCodeSize);
    const subBlocks = toSubBlocks(lzwData);
    const delayCs = Math.round(delayMs / 10); // centiseconds

    const frame: number[] = [];

    // Graphic Control Extension
    frame.push(0x21, 0xF9, 0x04);
    frame.push(0x00); // no disposal
    frame.push(delayCs & 0xff, (delayCs >> 8) & 0xff);
    frame.push(0x00); // transparent color index (none)
    frame.push(0x00); // block terminator

    // Image Descriptor
    frame.push(0x2C);
    frame.push(0, 0, 0, 0); // left, top
    frame.push(this.width & 0xff, (this.width >> 8) & 0xff);
    frame.push(this.height & 0xff, (this.height >> 8) & 0xff);
    frame.push(0x80 | 7); // local color table, 256 colors (2^(7+1))

    // Local Color Table
    for (let i = 0; i < 256; i++) {
      frame.push(palette[i * 3], palette[i * 3 + 1], palette[i * 3 + 2]);
    }

    // Image Data
    frame.push(minCodeSize);
    subBlocks.forEach(b => frame.push(b));

    this.frames.push(new Uint8Array(frame));
  }

  /** Finalize and return a Blob of the animated GIF. */
  finish(): Blob {
    const W = this.width;
    const H = this.height;

    const header: number[] = [
      // GIF Header
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
      W & 0xff, (W >> 8) & 0xff,
      H & 0xff, (H >> 8) & 0xff,
      0x70, // global color table (2^(0+1)=2 colors), no sort, 0 color res
      0, 0, // background index, pixel aspect ratio
      // Global color table (2 entries - dummy)
      0, 0, 0, 255, 255, 255,
      // Application Extension (Netscape looping)
      0x21, 0xFF, 0x0B,
      0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, // NETSCAPE2.0
      0x03, 0x01, 0x00, 0x00, // sub-block: loop count = 0 (infinite)
      0x00,
    ];

    const trailer = [0x3B];

    const parts: Uint8Array[] = [
      new Uint8Array(header),
      ...this.frames,
      new Uint8Array(trailer),
    ];

    const total = parts.reduce((s, p) => s + p.length, 0);
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
      buf.set(p, offset);
      offset += p.length;
    }

    return new Blob([buf], { type: 'image/gif' });
  }
}

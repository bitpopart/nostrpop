import { describe, it, expect } from 'vitest';
import {
  buildDigitalUnlimitedTemplate,
  countDigitalWithLeftoverStock,
} from './unlimitedStock';
import type { MarketplaceProduct } from './sampleProducts';
import type { NostrEvent } from '@nostrify/nostrify';

function makeEvent(kind: number, tags: string[][], content = ''): NostrEvent {
  return {
    id: 'testb'.padEnd(64, '0'),
    pubkey: '01'.repeat(32),
    created_at: 1234567890,
    kind,
    tags,
    content,
    sig: '01'.repeat(64),
  };
}

function product(
  type: 'digital' | 'physical',
  sourceKind: 30402 | 30018,
  event: NostrEvent
): MarketplaceProduct {
  return {
    id: event.tags.find(([n]) => n === 'd')?.[1] ?? 'event1',
    event,
    sourceKind,
    name: 'Test',
    description: '',
    images: [],
    currency: 'USD',
    price: 10,
    type,
    productSubtype: 'simple',
    category: 'Downloads',
    tags: [],
    keyword_tags: [],
    specs: [],
    shipping: [],
    digital_files: [],
    digital_file_names: [],
    stall_id: 'default',
    created_at: new Date(1234567890 * 1000).toISOString(),
  };
}

describe('buildDigitalUnlimitedTemplate', () => {
  it('strips the Gamma `stock` tag from a digital NIP-99 listing', () => {
    const ev = makeEvent(30402, [
      ['d', 'dl-1'],
      ['type', 'simple', 'digital'],
      ['title', '42 Pack'],
      ['status', 'active'],
      ['stock', '5'],
      ['t', 'downloads'],
    ]);
    const tpl = buildDigitalUnlimitedTemplate(product('digital', 30402, ev));
    expect(tpl).not.toBeNull();
    expect(tpl!.tags.some(([n]) => n === 'stock')).toBe(false);
    expect(tpl!.tags.find(([n]) => n === 'status')?.[1]).toBe('active');
    expect(tpl!.tags).toContainEqual(['t', 'downloads']);
    expect(tpl!.kind).toBe(30402);
  });

  it('flips a sold digital NIP-99 listing back to active', () => {
    const ev = makeEvent(30402, [
      ['d', 'dl-2'],
      ['type', 'simple', 'digital'],
      ['status', 'sold'],
      ['stock', '0'],
    ]);
    const tpl = buildDigitalUnlimitedTemplate(product('digital', 30402, ev));
    expect(tpl!.tags.some(([n]) => n === 'stock')).toBe(false);
    expect(tpl!.tags.find(([n]) => n === 'status')?.[1]).toBe('active');
  });

  it('returns null for a digital NIP-99 listing that already has no stock tag', () => {
    const ev = makeEvent(30402, [
      ['d', 'dl-3'],
      ['type', 'simple', 'digital'],
      ['t', 'downloads'],
    ]);
    expect(buildDigitalUnlimitedTemplate(product('digital', 30402, ev))).toBeNull();
  });

  it('drops the quantity field from a digital NIP-15 listing content', () => {
    const ev = makeEvent(
      30018,
      [['d', 'dl-4'], ['t', 'digital']],
      JSON.stringify({ name: 'Preset Bundle', quantity: 3, price: 19 })
    );
    const tpl = buildDigitalUnlimitedTemplate(product('digital', 30018, ev));
    expect(tpl).not.toBeNull();
    const parsed = JSON.parse(tpl!.content) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty('quantity');
    expect(parsed.name).toBe('Preset Bundle');
    expect(tpl!.kind).toBe(30018);
  });

  it('returns null for a physical product even when it has a stock tag', () => {
    const ev = makeEvent(30402, [
      ['d', 'phys-1'],
      ['type', 'simple', 'physical'],
      ['stock', '7'],
    ]);
    expect(buildDigitalUnlimitedTemplate(product('physical', 30402, ev))).toBeNull();
  });

  it('returns null for a digital NIP-15 listing with no quantity cap', () => {
    const ev = makeEvent(
      30018,
      [['d', 'dl-5'], ['t', 'digital']],
      JSON.stringify({ name: 'No Cap' })
    );
    expect(buildDigitalUnlimitedTemplate(product('digital', 30018, ev))).toBeNull();
  });
});

describe('countDigitalWithLeftoverStock', () => {
  it('counts only digital products still carrying a stock cap', () => {
    const withStock = product('digital', 30402,
      makeEvent(30402, [['d', 'a'], ['type', 'simple', 'digital'], ['stock', '3']]));
    const alreadyClean = product('digital', 30402,
      makeEvent(30402, [['d', 'b'], ['type', 'simple', 'digital']]));
    const physical = product('physical', 30402,
      makeEvent(30402, [['d', 'c'], ['type', 'simple', 'physical'], ['stock', '1']]));
    expect(countDigitalWithLeftoverStock([withStock, alreadyClean, physical])).toBe(1);
  });
});

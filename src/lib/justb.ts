/**
 * Just B — Mystery Box.
 *
 * The page at bitpopart.com/b is a self-contained static app shipped at
 * public/justb-app/index.html (same pattern as /zapwall). It renders its
 * whole data-driven surface (the six base B's + their ledger entries, the
 * surprise drops, the where-to-buy list, the launch date, the rarity ladder
 * and the ledger "updated" stamp) from a `window.JUSTB` config object.
 *
 * The owner manages that config from /admin → Just B. Every save publishes
 * the whole config as a Nostr kind-30078 settings event (d-tag
 * com.bitpopart.justb); bitpopart.com/b reads it and hands it to the iframe
 * via postMessage — no redeploy needed when numbers change. Until the owner
 * publishes, the static seed below is used (mirrors the seed embedded in the
 * standalone app, so the page is never empty).
 */

export const JUSTB_KIND = 30078;
export const JUSTB_D_TAG = 'com.bitpopart.justb';
export const JUSTB_DATA_SOURCE = 'bitpopart-justb';

export interface JustBBaseEntry {
  slug: string;
  no: string;
  name: string;
  pwr: number;
  cost: number;
  serial: string;
  move: string;
  released: number;
  /** First release date (YYYY-MM-DD), null = not filled in yet. */
  first: string | null;
  /** Bitcoin block height, null = not filled in yet. */
  block: number | null;
}

export interface JustBDrop {
  no: string;
  name: string;
  rarity: string;
  supply: number;
  released: number;
  /** 'live' = printed and out there, 'soon' = announced, not printed yet. */
  status: 'live' | 'soon';
  first: string | null;
  block: number | null;
}

export interface JustBShop {
  name: string;
  where: string;
  ships: string;
  /** Set to '' for a shop with no web store. */
  url: string;
}

export interface JustBLadder {
  name: string;
  run: string;
  deck: string;
  /** CSS color for the rung. */
  c: string;
}

export interface JustBData {
  /** Shown under the ledger so people know how fresh it is. */
  updated: string;
  /** The six base B's. 'released' is a running counter, NOT a cap. */
  base: JustBBaseEntry[];
  /** Surprise B's: fixed supply, never reprinted. */
  drops: JustBDrop[];
  /** Launch date (YYYY-MM-DD). */
  launch: string;
  shops: JustBShop[];
  /** Rarity ladder, defined by print run. */
  ladder: JustBLadder[];
}

/** Seed config — mirrors window.JUSTB in public/justb-app/index.html. */
export const DEFAULT_JUSTB: JustBData = {
  "updated": "2026-10-18",
  "base": [
    {
      "slug": "beautiful",
      "no": "01",
      "name": "B-BEAUTIFUL",
      "pwr": 6,
      "cost": 3,
      "serial": "∞",
      "move": "GOLDEN SAT FLASH",
      "released": 15,
      "first": null,
      "block": null
    },
    {
      "slug": "geeky",
      "no": "02",
      "name": "B-GEEKY",
      "pwr": 6,
      "cost": 3,
      "serial": "∞",
      "move": "HASH RATE HEADBUTT",
      "released": 0,
      "first": null,
      "block": null
    },
    {
      "slug": "cool",
      "no": "03",
      "name": "B-COOL",
      "pwr": 6,
      "cost": 3,
      "serial": "∞",
      "move": "GOLDEN SAT FLASH",
      "released": 0,
      "first": null,
      "block": null
    },
    {
      "slug": "lightning",
      "no": "04",
      "name": "B-LIGHTNING",
      "pwr": 7,
      "cost": 4,
      "serial": "∞",
      "move": "THUNDER STACK STRIKE",
      "released": 6,
      "first": null,
      "block": null
    },
    {
      "slug": "coffee",
      "no": "05",
      "name": "B-COFFEE",
      "pwr": 7,
      "cost": 4,
      "serial": "∞",
      "move": "GRIND & HUSTLE",
      "released": 8,
      "first": null,
      "block": null
    },
    {
      "slug": "bullish",
      "no": "06",
      "name": "B-BULLISH",
      "pwr": 8,
      "cost": 4,
      "serial": "∞",
      "move": "GREEN CANDLE CHARGE",
      "released": 21,
      "first": null,
      "block": null
    }
  ],
  "drops": [
    {
      "no": "07",
      "name": "B-SUPERMAN",
      "rarity": "Fixed run",
      "supply": 8,
      "released": 8,
      "status": "live",
      "first": null,
      "block": null
    },
    {
      "no": "08",
      "name": "MYSTERY B #01",
      "rarity": "Mystery Rare",
      "supply": 21,
      "released": 0,
      "status": "soon",
      "first": null,
      "block": null
    }
  ],
  "launch": "2026-11-21",
  "shops": [
    {
      "name": "bitpopart.com",
      "where": "Online",
      "ships": "Ships worldwide",
      "url": "https://bitpopart.com"
    }
  ],
  "ladder": [
    {
      "name": "STREET",
      "run": "∞ unlimited",
      "deck": "4 per deck",
      "c": "#000000"
    },
    {
      "name": "RARE",
      "run": "numbered of 1000",
      "deck": "4 per deck",
      "c": "#f97316"
    },
    {
      "name": "ULTRA RARE",
      "run": "numbered of 100",
      "deck": "1 per deck",
      "c": "#4cc1bb"
    },
    {
      "name": "MYSTERY",
      "run": "numbered of 21",
      "deck": "1 per deck",
      "c": "#facc15"
    }
  ]
};


function str(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function num(v: unknown, d = 0): number {
  const n = numOrNull(v);
  return n === null ? d : n;
}

/**
 * Coerce parsed relay content into a clean Just B config.
 * Returns `null` when the content is not a Just B config at all (caller
 * falls back to the seed); a valid-but-emptied list is kept as-is.
 */
export function sanitizeJustB(input: unknown): JustBData | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const baseRaw = Array.isArray(o.base) ? o.base : null;
  const dropsRaw = Array.isArray(o.drops) ? o.drops : [];
  const shopsRaw = Array.isArray(o.shops) ? o.shops : [];
  const ladderRaw = Array.isArray(o.ladder) ? o.ladder : [];
  if (!baseRaw || baseRaw.length === 0) return null;

  const base: JustBBaseEntry[] = baseRaw
    .map((x): JustBBaseEntry | null => {
      if (!x || typeof x !== 'object') return null;
      const e = x as Record<string, unknown>;
      if (typeof e.slug !== 'string' || !e.slug.trim()) return null;
      return {
        slug: e.slug.trim(),
        no: str(e.no),
        name: str(e.name),
        pwr: num(e.pwr),
        cost: num(e.cost),
        serial: str(e.serial),
        move: str(e.move),
        released: num(e.released),
        first: str(e.first, '') || null,
        block: numOrNull(e.block),
      };
    })
    .filter((x): x is JustBBaseEntry => x !== null);

  if (base.length === 0) return null;

  const drops: JustBDrop[] = dropsRaw
    .map((x): JustBDrop | null => {
      if (!x || typeof x !== 'object') return null;
      const e = x as Record<string, unknown>;
      const status = e.status === 'soon' ? 'soon' : 'live';
      return {
        no: str(e.no),
        name: str(e.name),
        rarity: str(e.rarity),
        supply: num(e.supply),
        released: num(e.released),
        status,
        first: str(e.first, '') || null,
        block: numOrNull(e.block),
      };
    })
    .filter((x): x is JustBDrop => x !== null);

  const shops: JustBShop[] = shopsRaw
    .map((x): JustBShop | null => {
      if (!x || typeof x !== 'object') return null;
      const e = x as Record<string, unknown>;
      if (typeof e.name !== 'string' || !e.name.trim()) return null;
      return { name: e.name.trim(), where: str(e.where), ships: str(e.ships), url: str(e.url) };
    })
    .filter((x): x is JustBShop => x !== null);

  const ladder: JustBLadder[] = ladderRaw
    .map((x): JustBLadder | null => {
      if (!x || typeof x !== 'object') return null;
      const e = x as Record<string, unknown>;
      if (typeof e.name !== 'string' || !e.name.trim()) return null;
      return { name: e.name.trim(), run: str(e.run), deck: str(e.deck), c: str(e.c, '#000000') };
    })
    .filter((x): x is JustBLadder => x !== null);

  return {
    updated: str(o.updated),
    base,
    drops,
    launch: str(o.launch),
    shops,
    ladder,
  };
}

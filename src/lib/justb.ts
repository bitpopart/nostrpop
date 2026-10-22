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

/**
 * Hard cap on stored claim-code hashes. Each hash costs ~69 bytes in the
 * published event and the config goes to public relays (ditto, primal, …)
 * that reject very large events — keep the list well under their limits.
 */
export const MAX_JUSTB_CODES = 1000;
/** Above this count the saved event gets close to common relay size caps. */
export const WARN_JUSTB_CODES = 750;

/** Matches a stored SHA-256 hash: 64 lowercase hex chars. */
export const JUSTB_HASH_RE = /^[0-9a-f]{64}$/;

/**
 * Claim-code registry (the "VERIFY MY ITEM" check on /b).
 *
 * SECURITY: the published kind-30078 config only ever contains SHA-256
 * hashes of claim codes — never the plaintext codes. Admin enters codes in
 * the admin UI, they are hashed in the browser before publish, and the /b
 * page hashes the visitor's entry and checks membership. Anyone reading the
 * relays sees only hashes and cannot recover the codes.
 */
export interface JustBCodes {
  /** Lowercase-hex SHA-256 of each claim code (normalized: trimmed, upper-cased). */
  hashes: string[];
}

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

/** One of the in-page viewer buttons on /b (Play online / Full ledger). */
export interface JustBPage {
  /** Button label, e.g. "PLAY JUST B ONLINE". */
  label: string;
  /** Page URL opened INSIDE the /b page (same origin, e.g. /justb-app/online.html). */
  url: string;
}

/** One card inside a "New cards" post of the What's New feed (/new). */
export interface JustBNewsCard {
  name: string;
  /** Display label, e.g. "Ultra Rare". */
  kind: string;
  /** Look used for the pill colour: street | rare | ultra | mystery. */
  rarity: string;
  /** Image name from the page's built-in bank (e.g. "karat") or an https:// address. */
  image: string;
  /** Small note under the card, e.g. "Numbered of 100." */
  note: string;
}

/** One post on the What's New feed (bitpopart.com/new). */
export interface JustBNewsPost {
  id: string;
  /** Mystery B teaser | New cards drop | plain news. */
  type: 'mystery' | 'cards' | 'news';
  status: 'coming' | 'live' | 'soldout';
  /** Posted date (YYYY-MM-DD). The feed sorts newest first by this. */
  date: string;
  title: string;
  text: string;
  /** Image name from the page's built-in bank or an https:// address. */
  image: string;
  /** Optional drop date (YYYY-MM-DD) — shows a countdown while status is coming. */
  dropDate: string;
  /** Optional print run text, e.g. "21". */
  run: string;
  link: { label: string; url: string };
  cards: JustBNewsCard[];
}

/** What's New feed config (bitpopart.com/new) — mirrors the owner's whats-new.html data. */
export interface JustBNewsFeed {
  title: string;
  intro: string;
  shopUrl: string;
  ledgerUrl: string;
  posts: JustBNewsPost[];
}

/**
 * BitBot — the pocket bot page at bitpopart.com/bitbot.
 *
 * Same live-update principle as the rest of Just B: the owner edits these
 * fields in /admin → Just B → BitBot, every save publishes them with the
 * same kind-30078 config, and the /bitbot page re-renders from the relays —
 * no redeploy when copy or the birth date changes.
 */
export interface BitBotConfig {
  /** Spec sheet version, e.g. "V21.001". */
  version: string;
  /** Hero tag line, e.g. "Made by hand". */
  tagline: string;
  /** Hero paragraph (may contain <b>…</b>). */
  lead: string;
  /** Feature bullets, one per list item. */
  features: string[];
  /** "BUY ONCE" / "FREE FOREVER" yellow block. */
  buyTitle: string;
  buySub: string;
  /** Paragraphs of the buy-once block (may contain <b>…</b>). */
  buyLines: string[];
  /** Small print under the CTA, e.g. "Spec sheet V21.001 · built to order …". */
  specNote: string;
  /** Birth date (YYYY-MM-DD). Empty string = to be announced. */
  birth: string;
  /** Big status stamp, e.g. "IN PROGRESS". */
  status: string;
  /** Availability note shown while BitBots are not for sale. */
  availability: string;
  /** True once BitBots can actually be bought (shows the buy CTA). */
  available: boolean;
  /** CTA button — used on /b ("GET A BITBOT" → /bitbot) and /bitbot once available. */
  cta: { label: string; url: string };
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
  /** "PLAY JUST B ONLINE" button + page, opened inside the page. */
  online: JustBPage;
  /** "OPEN THE FULL LEDGER" button + page, opened inside the page. */
  ledger: JustBPage;
  /** BitBot (/bitbot) page config — birth date, status, copy, CTA. */
  bitbot: BitBotConfig;
  /** Claim-code hash registry for the "VERIFY MY ITEM" check on /b. */
  codes: JustBCodes;
  /** What's New feed (bitpopart.com/new) — new collectibles & cards announcements. */
  news: JustBNewsFeed;
}

/**
 * Seed BitBot config — mirrors the BitBot section in
 * public/justb-app/index.html. `birth` is empty until the owner sets it in
 * /admin (the page then shows "To be announced").
 */
export const DEFAULT_BITBOT: BitBotConfig = {
  version: 'V21.001',
  tagline: 'Made by hand',
  lead:
    'A <b>pocket bot we build by hand</b>, one at a time, then ship ready to switch on. You just talk to it. It zaps, it listens, it nags you about bedtime. Small enough to go in your bag, so it comes along for the ride.',
  features: [
    'Mini display with camera',
    'Zap lamp, it lights up',
    'Nostr built in',
    'Hook up your Lightning wallet, send and receive zaps',
    'Talk to your bot, it talks back',
    'It teaches you its own tips and tricks',
    'Give it tasks and keep it entertained',
    'Tells the time',
    "Tells you when it's your bedtime",
    'Plays tunes',
    'Hand gestures to control it',
  ],
  buyTitle: 'BUY ONCE',
  buySub: 'FREE FOREVER',
  buyLines: [
    'You buy the <b>hardware</b>. That is the one and only thing you ever pay for.',
    'The <b>software keeps coming, free</b>. New tricks, new tools, new nonsense dropped in regularly, so the bot you get today is not the bot you have in six months. Same box, more in it.',
  ],
  specNote: 'Spec sheet V21.001 · built to order · software updates always free',
  birth: '',
  status: 'IN PROGRESS',
  availability:
    'BitBot is still in the workshop — not available to buy yet. When the first batch is ready, it will be announced right here.',
  available: false,
  cta: { label: 'GET A BITBOT', url: '/bitbot' },
};

/**
 * Default What's New feed — mirrors the seed JSON embedded in
 * public/justb-app/whats-new.html, so the /new page and the /admin editor
 * show exactly what the owner designed before any save.
 */
export const DEFAULT_WHATS_NEW: JustBNewsFeed = {
  title: "WHAT'S NEW",
  intro: '',
  shopUrl: 'https://bitpopart.com/shop',
  ledgerUrl: 'https://bitpopart.com/rare',
  posts: [
    {
      id: 'mystery-next',
      type: 'mystery',
      status: 'coming',
      date: '2026-10-22',
      title: 'A new Mystery B is coming',
      text: 'Shhh. A new B is on its way. Nobody knows who it is yet. When it drops it gets its own numbered run, and once it is sold out it never gets printed again.\nWatch this page. The reveal lands here first.',
      image: 'mysteryb',
      dropDate: '',
      run: '',
      link: { label: 'SEE THE RARITY LEDGER', url: 'https://bitpopart.com/rare' },
      cards: [],
    },
    {
      id: 'launch',
      type: 'news',
      status: 'coming',
      date: '2026-10-22',
      title: 'Just B goes on sale',
      text: 'Just Box, the Just B cards and the collectibles are available worldwide from 21 November 2026.',
      image: '',
      dropDate: '2026-11-21',
      run: '',
      link: { label: 'GET IT', url: 'https://bitpopart.com/shop' },
      cards: [],
    },
    {
      id: 'cards-gold',
      type: 'cards',
      status: 'live',
      date: '2026-10-22',
      title: 'New cards in the deck',
      text: 'Fresh cards for the Just B trading card game. Numbered ones come with a serial number you can check in the Rarity Ledger.',
      image: 'karat',
      run: '',
      dropDate: '',
      link: { label: 'CHECK YOUR CARD', url: 'https://bitpopart.com/rare' },
      cards: [
        { name: 'B-24 Karat', kind: 'Ultra Rare', rarity: 'ultra', image: 'karat', note: 'Numbered of 100.' },
        { name: 'B-Goldrush', kind: 'Ultra Rare', rarity: 'ultra', image: 'goldrush', note: 'Numbered of 100.' },
        { name: 'Diamond Hands', kind: 'Ultra Rare', rarity: 'ultra', image: 'dhands', note: 'Numbered of 100.' },
      ],
    },
  ],
};

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
  ],
  "online": { "label": "PLAY JUST B ONLINE", "url": "/justb-app/online.html" },
  "ledger": { "label": "OPEN THE FULL LEDGER", "url": "/justb-app/ledger.html" },
  "bitbot": DEFAULT_BITBOT,
  "codes": { "hashes": [] },
  "news": DEFAULT_WHATS_NEW
};


function str(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d;
}

/**
 * Normalize a claim code before hashing — the SAME normalization the /b
 * page applies when a visitor checks a code, so both sides agree:
 * trim surrounding whitespace and upper-case (codes under scratch-off
 * stickers are typically printed in capitals; this makes entry forgiving).
 */
export function normalizeJustBCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * SHA-256 of a claim code as lowercase hex — the only form ever stored or
 * published. Runs in the browser (Web Crypto); needs a secure context,
 * which bitpopart.com and localhost both are.
 */
export async function justbHashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeJustBCode(code));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
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

  const page = (raw: unknown, dlabel: string, durl: string): JustBPage => {
    if (!raw || typeof raw !== 'object') return { label: dlabel, url: durl };
    const e = raw as Record<string, unknown>;
    return { label: str(e.label, dlabel) || dlabel, url: str(e.url, durl) || durl };
  };

  /* claim-code hash registry: keep only valid lowercase-hex SHA-256 hashes,
     dedupe (preserving order) and cap the list so the event stays small
     enough for public relays. Anything malformed is dropped. */
  const codesHashes: string[] = [];
  const codesRaw = o.codes && typeof o.codes === 'object' ? (o.codes as Record<string, unknown>) : {};
  if (Array.isArray(codesRaw.hashes)) {
    const seen = new Set<string>();
    for (const h of codesRaw.hashes) {
      if (codesHashes.length >= MAX_JUSTB_CODES) break;
      if (typeof h !== 'string') continue;
      const hh = h.trim().toLowerCase();
      if (!JUSTB_HASH_RE.test(hh) || seen.has(hh)) continue;
      seen.add(hh);
      codesHashes.push(hh);
    }
  }

  return {
    updated: str(o.updated),
    base,
    drops,
    launch: str(o.launch),
    shops,
    ladder,
    online: page(o.online, DEFAULT_JUSTB.online.label, DEFAULT_JUSTB.online.url),
    ledger: page(o.ledger, DEFAULT_JUSTB.ledger.label, DEFAULT_JUSTB.ledger.url),
    bitbot: sanitizeBitBot(o.bitbot),
    codes: { hashes: codesHashes },
    news: sanitizeWhatsNew(o.news),
  };
}

/**
 * Coerce a stored BitBot section into a clean config. Anything missing or
 * malformed falls back to the seed so the page always renders complete.
 */
export function sanitizeBitBot(input: unknown): BitBotConfig {
  if (!input || typeof input !== 'object') return DEFAULT_BITBOT;
  const o = input as Record<string, unknown>;
  const s = (v: unknown, d: string): string => (typeof v === 'string' ? v : d);
  const lines = (v: unknown, d: string[]): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim())
      : d;
  const ctaRaw = o.cta && typeof o.cta === 'object' ? (o.cta as Record<string, unknown>) : {};
  return {
    version: s(o.version, DEFAULT_BITBOT.version) || DEFAULT_BITBOT.version,
    tagline: s(o.tagline, DEFAULT_BITBOT.tagline) || DEFAULT_BITBOT.tagline,
    lead: s(o.lead, DEFAULT_BITBOT.lead) || DEFAULT_BITBOT.lead,
    features: (lines(o.features, DEFAULT_BITBOT.features).length > 0
      ? lines(o.features, DEFAULT_BITBOT.features)
      : DEFAULT_BITBOT.features),
    buyTitle: s(o.buyTitle, DEFAULT_BITBOT.buyTitle) || DEFAULT_BITBOT.buyTitle,
    buySub: s(o.buySub, DEFAULT_BITBOT.buySub) || DEFAULT_BITBOT.buySub,
    buyLines: (lines(o.buyLines, DEFAULT_BITBOT.buyLines).length > 0
      ? lines(o.buyLines, DEFAULT_BITBOT.buyLines)
      : DEFAULT_BITBOT.buyLines),
    specNote: s(o.specNote, DEFAULT_BITBOT.specNote) || DEFAULT_BITBOT.specNote,
    birth: s(o.birth, '').trim(),
    status: s(o.status, DEFAULT_BITBOT.status) || DEFAULT_BITBOT.status,
    availability: s(o.availability, DEFAULT_BITBOT.availability) || DEFAULT_BITBOT.availability,
    available: o.available === true,
    cta: {
      label: s(ctaRaw.label, DEFAULT_BITBOT.cta.label) || DEFAULT_BITBOT.cta.label,
      url: s(ctaRaw.url, DEFAULT_BITBOT.cta.url) || DEFAULT_BITBOT.cta.url,
    },
  };
}

const WHATS_NEW_TYPES = ['mystery', 'cards', 'news'] as const;
const WHATS_NEW_STATUS = ['coming', 'live', 'soldout'] as const;
const WHATS_NEW_RARITY = ['street', 'rare', 'ultra', 'mystery'] as const;

/**
 * Coerce a stored What's New section (bitpopart.com/new) into a clean feed.
 * Missing/malformed values fall back to the owner's seed. Posts without a
 * title are dropped so a half-finished draft never ships to the page.
 */
export function sanitizeWhatsNew(input: unknown): JustBNewsFeed {
  if (!input || typeof input !== 'object') return DEFAULT_WHATS_NEW;
  const o = input as Record<string, unknown>;

  const post = (raw: unknown): JustBNewsPost | null => {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as Record<string, unknown>;
    const title = str(p.title).trim();
    if (!title) return null;
    const type = WHATS_NEW_TYPES.includes(p.type as never) ? (p.type as JustBNewsPost['type']) : 'news';
    const status = WHATS_NEW_STATUS.includes(p.status as never) ? (p.status as JustBNewsPost['status']) : 'coming';
    const linkRaw = p.link && typeof p.link === 'object' ? (p.link as Record<string, unknown>) : {};
    const cardsRaw = Array.isArray(p.cards) ? p.cards : [];
    const cards: JustBNewsCard[] = cardsRaw
      .map((c): JustBNewsCard | null => {
        if (!c || typeof c !== 'object') return null;
        const e = c as Record<string, unknown>;
        if (!str(e.name).trim()) return null;
        const rarity = WHATS_NEW_RARITY.includes(e.rarity as never) ? (e.rarity as string) : 'street';
        return {
          name: str(e.name).trim(),
          kind: str(e.kind),
          rarity,
          image: str(e.image),
          note: str(e.note),
        };
      })
      .filter((c): c is JustBNewsCard => c !== null);
    return {
      id: str(p.id).trim() || 'post-' + Math.random().toString(36).slice(2, 8),
      type,
      status,
      date: str(p.date).trim(),
      title,
      text: str(p.text),
      image: str(p.image),
      dropDate: str(p.dropDate).trim(),
      run: str(p.run).trim(),
      link: { label: str(linkRaw.label), url: str(linkRaw.url) },
      cards,
    };
  };

  const posts = Array.isArray(o.posts)
    ? o.posts.map(post).filter((p): p is JustBNewsPost => p !== null)
    : DEFAULT_WHATS_NEW.posts;

  return {
    title: str(o.title).trim() || DEFAULT_WHATS_NEW.title,
    intro: str(o.intro),
    shopUrl: str(o.shopUrl).trim() || DEFAULT_WHATS_NEW.shopUrl,
    ledgerUrl: str(o.ledgerUrl).trim() || DEFAULT_WHATS_NEW.ledgerUrl,
    posts,
  };
}

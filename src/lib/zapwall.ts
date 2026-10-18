/**
 * Zapwall — Stream Road channels & events.
 *
 * The Zapwall dashboard (public/zapwall-app/index.html) ships with a static
 * CHANNELS seed list so it works standalone. The real list is managed by the
 * owner from /admin → Zapwall; every save publishes a Nostr kind-30078
 * settings event (d-tag com.bitpopart.zapwall-channels) to the site's relays.
 * bitpopart.com/zapwall reads that event and hands the list to the dashboard
 * via postMessage — no redeploy needed when channels/events change.
 */

export const ZAPWALL_CHANNELS_KIND = 30078;
export const ZAPWALL_CHANNELS_D_TAG = 'com.bitpopart.zapwall-channels';

export type ZapwallStatus = 'live' | 'soon' | 'off';

export interface ZapwallChannel {
  id: string;
  name: string;
  handle: string;
  cat: string;
  lang: string;
  status: ZapwallStatus;
  /** True while the channel is a placeholder — shows the "example" banner. */
  example: boolean;
  url: string;
  ln: string;
  schedule: string;
  about: { en: string };
  a?: string;
  b?: string;
  g?: string;
}

/** Seed list — mirrors the static CHANNELS in public/zapwall-app/index.html. */
export const DEFAULT_ZAPWALL_CHANNELS: ZapwallChannel[] = [
  {
    id: 'bitfest-zap-wall', name: 'Bitfest Zap Wall', handle: 'bitpopart', cat: 'Event', lang: 'EN',
    status: 'soon', example: false, url: 'https://streamroad.money/',
    ln: 'bitpopart@walletofsatoshi.com', schedule: 'Around BitFest UK, 19-22 Nov 2026',
    about: { en: 'The zap wall for BitFest UK in Manchester. Zap it, watch it fill up.' },
    a: '#fb923c', b: '#ea580c', g: 'rgba(251,146,60,.5)',
  },
  {
    id: 'bitpopart-live', name: 'BitPopArt Live', handle: 'bitpopart', cat: 'Art', lang: 'EN',
    status: 'soon', example: false, url: 'https://streamroad.money/',
    ln: 'bitpopart@walletofsatoshi.com', schedule: 'Time to be added',
    about: { en: 'Live art sessions. Pop art, sketching, chat and zaps.' },
    a: '#c026d3', b: '#6d28d9', g: 'rgba(192,38,211,.5)',
  },
  {
    id: 'zap-art-wall', name: 'Zap Art Wall', handle: 'bitpopart', cat: 'Art', lang: 'EN',
    status: 'soon', example: false, url: 'https://streamroad.money/',
    ln: 'bitpopart@walletofsatoshi.com', schedule: 'Time to be added',
    about: { en: 'An art wall that grows with every zap.' },
    a: '#ec4899', b: '#9d174d', g: 'rgba(236,72,153,.5)',
  },
];

/**
 * Coerce parsed relay content into a clean channel list.
 * Returns `[]` for a valid-but-empty list (owner deleted everything) and
 * `null` when the content is not a channel list at all (caller falls back).
 */
export function sanitizeZapwallChannels(input: unknown): ZapwallChannel[] | null {
  if (!Array.isArray(input)) return null;
  return input
    .map((x): ZapwallChannel | null => {
      if (!x || typeof x !== 'object') return null;
      const o = x as Record<string, unknown>;
      if (typeof o.id !== 'string' || !o.id.trim()) return null;
      if (typeof o.name !== 'string' || !o.name.trim()) return null;
      const status: ZapwallStatus = o.status === 'live' || o.status === 'soon' ? o.status : 'off';
      const about = o.about && typeof o.about === 'object' ? (o.about as Record<string, unknown>) : {};
      const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
      return {
        id: o.id.trim(),
        name: o.name.trim(),
        handle: str(o.handle),
        cat: str(o.cat),
        lang: str(o.lang, 'EN'),
        status,
        example: o.example === true,
        url: str(o.url, 'https://streamroad.money/'),
        ln: str(o.ln),
        schedule: str(o.schedule),
        about: { en: str(about.en) },
        ...(typeof o.a === 'string' && o.a ? { a: o.a } : {}),
        ...(typeof o.b === 'string' && o.b ? { b: o.b } : {}),
        ...(typeof o.g === 'string' && o.g ? { g: o.g } : {}),
      };
    })
    .filter((x): x is ZapwallChannel => x !== null);
}

/**
 * Nostr kind for BitPop ecards.
 *
 * Kind 35007 is a custom addressable event kind (30000–39999 range) used
 * exclusively for BitPop greeting/ecards. Using a dedicated kind keeps cards
 * completely separate from NIP-99 (kind 30402) product listings, so they never
 * show up as shop items on Nostr marketplaces like Conduit, Shopstr, or Plebeian.
 *
 * Events are identified by their "d" tag (e.g. "card-1782716227372").
 * A NIP-31 "alt" tag is included so generic Nostr clients can display a
 * human-readable description instead of raw JSON.
 */
export const ECARD_KIND = 35007;

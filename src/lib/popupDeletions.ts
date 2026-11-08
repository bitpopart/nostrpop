import type { NostrEvent } from '@nostrify/nostrify';

/**
 * NIP-09: drop events that the author has asked to delete. Many relays keep
 * serving an addressable event after a kind 5 request (or never receive it),
 * so the page has to apply the deletion itself.
 *
 * - `e` tags delete that exact event id.
 * - `a` tags delete every version of the addressable event published at or
 *   before the deletion request, so a later re-publish of the same event
 *   still shows.
 * Only the author of an event can delete it.
 */
export function removeDeletedEvents(events: NostrEvent[], deletions: NostrEvent[]): NostrEvent[] {
  const deletedIds = new Set<string>();
  const deletedAddr = new Map<string, number>(); // address -> latest deletion time

  for (const del of deletions) {
    if (del.kind !== 5) continue;
    for (const tag of del.tags) {
      if (tag[0] === 'e' && tag[1]) deletedIds.add(`${del.pubkey}:${tag[1]}`);
      if (tag[0] === 'a' && tag[1]) {
        const [, pubkey] = tag[1].split(':');
        if (pubkey !== del.pubkey) continue; // can only delete your own events
        deletedAddr.set(tag[1], Math.max(deletedAddr.get(tag[1]) ?? 0, del.created_at));
      }
    }
  }

  return events.filter((ev) => {
    if (deletedIds.has(`${ev.pubkey}:${ev.id}`)) return false;
    const d = ev.tags.find((t) => t[0] === 'd')?.[1];
    if (d !== undefined) {
      const at = deletedAddr.get(`${ev.kind}:${ev.pubkey}:${d}`);
      if (at !== undefined && ev.created_at <= at) return false;
    }
    return true;
  });
}

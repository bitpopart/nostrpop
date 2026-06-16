import { useNostr } from "@nostrify/react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { toast } from 'sonner';

import { useCurrentUser } from "./useCurrentUser";

import type { NostrEvent } from "@nostrify/nostrify";

/** Event template accepted by `useNostrPublish`. */
export type EventTemplate = Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> & {
  /**
   * The previous version of the event being replaced (for replaceable/addressable kinds).
   * When provided, `published_at` from the old event is preserved on the new one.
   * When omitted and the kind is replaceable or addressable, `published_at` is set
   * equal to `created_at` so the two always match on first publish.
   */
  prev?: NostrEvent;
};

/** Returns true if the kind falls in a replaceable or addressable range. */
function isReplaceableKind(kind: number): boolean {
  // Legacy replaceable kinds
  if (kind === 0 || kind === 3) return true;
  // Replaceable (10000-19999) or addressable (30000-39999)
  return (kind >= 10000 && kind < 20000) || (kind >= 30000 && kind < 40000);
}

export function useNostrPublish(): UseMutationResult<NostrEvent> {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (t: EventTemplate) => {
      if (user) {
        // Extract `prev` before building the event — it's not part of the Nostr event schema.
        const { prev, ...template } = t;
        const tags = [...(template.tags ?? [])];

        // Add the client tag if it doesn't exist
        if (location.protocol === "https:" && !tags.some(([name]) => name === "client")) {
          tags.push(["client", location.hostname]);
        }

        const created_at = template.created_at ?? Math.floor(Date.now() / 1000);

        // Handle published_at for replaceable/addressable events (NIP-24)
        if (isReplaceableKind(template.kind) && !tags.some(([name]) => name === "published_at")) {
          if (prev) {
            // Preserve published_at from the previous event if it had one
            const oldTag = prev.tags.find(([name]) => name === "published_at");
            if (oldTag) {
              tags.push(["published_at", oldTag[1]]);
            }
          } else {
            // First publish: set published_at equal to created_at
            tags.push(["published_at", String(created_at)]);
          }
        }

        // Warn Alby users that the signing popup may appear blank — they need to click
        // the Alby extension icon in the browser toolbar to approve.
        // We check for any NIP-07 extension (window.nostr) as the hint applies to all of them.
        const loginType = (user as { type?: string }).type;
        const isExtensionLogin = loginType === 'extension' || loginType === 'nip07';
        const hasNip07Extension = typeof (window as Window & { nostr?: unknown }).nostr !== 'undefined';
        if (isExtensionLogin || hasNip07Extension) {
          toast.info('A signing request will pop up. If the Alby window appears blank, click the Alby icon in your browser toolbar to approve.', {
            id: 'alby-signing-hint',
            duration: 8000,
          });
        }

        const event = await user.signer.signEvent({
          kind: template.kind,
          content: template.content ?? "",
          tags,
          created_at,
        });

        if (event.pubkey !== user.pubkey) {
          throw new Error(
            "Signed event pubkey does not match the currently selected account. Please check your signer configuration.",
          );
        }

        await nostr.event(event, { signal: AbortSignal.timeout(5000) });
        return event;
      } else {
        throw new Error("User is not logged in");
      }
    },
    onError: (error) => {
      console.error("Failed to publish event:", error);
    },
    onSuccess: (data) => {
      console.log("Event published successfully:", data.id, "kind:", data.kind);
    },
  });
}

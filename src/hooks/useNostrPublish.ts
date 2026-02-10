import { useNostr } from "@nostrify/react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { useCurrentUser } from "./useCurrentUser";

import type { NostrEvent } from "@nostrify/nostrify";

export function useNostrPublish(): UseMutationResult<NostrEvent> {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (t: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => {
      console.log('[useNostrPublish] Publishing event, kind:', t.kind, 'tags:', t.tags?.slice(0, 5));
      
      if (user) {
        const tags = t.tags ?? [];

        // Add the client tag if it doesn't exist
        if (location.protocol === "https:" && !tags.some(([name]) => name === "client")) {
          tags.push(["client", location.hostname]);
        }

        console.log('[useNostrPublish] Signing event...');
        const event = await user.signer.signEvent({
          kind: t.kind,
          content: t.content ?? "",
          tags,
          created_at: t.created_at ?? Math.floor(Date.now() / 1000),
        });

        console.log('[useNostrPublish] Event signed, publishing to relay...', event.id);
        await nostr.event(event, { signal: AbortSignal.timeout(5000) });
        console.log('[useNostrPublish] Event published successfully to relay');
        return event;
      } else {
        console.error('[useNostrPublish] User is not logged in');
        throw new Error("User is not logged in");
      }
    },
    onError: (error) => {
      console.error("[useNostrPublish] Failed to publish event:", error);
    },
    onSuccess: (data) => {
      console.log("[useNostrPublish] Event published successfully:", data.id, "kind:", data.kind);
    },
  });
}
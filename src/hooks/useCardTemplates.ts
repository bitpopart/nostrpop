import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import type { NostrEvent } from '@nostrify/nostrify';

export const CARD_TEMPLATE_KIND = 30078;
export const CARD_TEMPLATE_D_PREFIX = 'bitpop-card-template:';

export interface CardTemplate {
  id: string;
  name: string;
  description?: string;
  coverImage: string;
  category?: string;
  pubkey: string;
  createdAt: number;
  event: NostrEvent;
}

function parseTemplateEvent(event: NostrEvent): CardTemplate | null {
  try {
    const dTag = event.tags.find(([name]) => name === 'd')?.[1];
    if (!dTag || !dTag.startsWith(CARD_TEMPLATE_D_PREFIX)) return null;

    const id = dTag.replace(CARD_TEMPLATE_D_PREFIX, '');
    const name = event.tags.find(([name]) => name === 'name')?.[1];
    if (!name) return null;

    const description = event.tags.find(([name]) => name === 'description')?.[1];
    const coverImage = event.tags.find(([name]) => name === 'image')?.[1];
    if (!coverImage) return null;

    const category = event.tags.find(([name]) => name === 'category')?.[1];

    // Check deleted marker
    const deleted = event.tags.find(([name]) => name === 'deleted')?.[1];
    if (deleted === 'true') return null;

    return {
      id,
      name,
      description,
      coverImage,
      category,
      pubkey: event.pubkey,
      createdAt: event.created_at,
      event,
    };
  } catch {
    return null;
  }
}

export function useCardTemplates() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['card-templates', adminPubkey],
    queryFn: async (c) => {
      if (!adminPubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [
          {
            kinds: [CARD_TEMPLATE_KIND],
            authors: [adminPubkey],
            limit: 200,
          },
        ],
        { signal }
      );

      const templateEvents = events.filter((e) =>
        e.tags.some(([name, val]) => name === 'd' && val?.startsWith(CARD_TEMPLATE_D_PREFIX))
      );

      return templateEvents
        .map(parseTemplateEvent)
        .filter((t): t is CardTemplate => t !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 30_000,
  });
}

export function useCreateCardTemplate() {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const mutate = (
    template: { id: string; name: string; description?: string; coverImage: string; category?: string },
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    const dTag = `${CARD_TEMPLATE_D_PREFIX}${template.id}`;

    const tags: string[][] = [
      ['d', dTag],
      ['name', template.name],
      ['image', template.coverImage],
      ['alt', `BitPop Card Template: ${template.name}`],
    ];

    if (template.description) tags.push(['description', template.description]);
    if (template.category) tags.push(['category', template.category]);

    createEvent(
      {
        kind: CARD_TEMPLATE_KIND,
        content: '',
        tags,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['card-templates'] });
          options?.onSuccess?.();
        },
        onError: (err: Error) => {
          options?.onError?.(err);
        },
      }
    );
  };

  return { mutate, isPending };
}

export function useDeleteCardTemplate() {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const mutate = (
    templateId: string,
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    const dTag = `${CARD_TEMPLATE_D_PREFIX}${templateId}`;

    createEvent(
      {
        kind: CARD_TEMPLATE_KIND,
        content: '',
        tags: [
          ['d', dTag],
          ['name', '__deleted__'],
          ['image', ''],
          ['alt', 'Deleted BitPop Card Template'],
          ['deleted', 'true'],
        ],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['card-templates'] });
          options?.onSuccess?.();
        },
        onError: (err: Error) => {
          options?.onError?.(err);
        },
      }
    );
  };

  return { mutate, isPending };
}

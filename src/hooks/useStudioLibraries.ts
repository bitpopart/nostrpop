import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  StudioLibrary,
  StudioImage,
  STUDIO_LIBRARY_KIND,
  STUDIO_LIBRARY_D_PREFIX,
} from '@/lib/studioTypes';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Parse a Nostr event into a StudioLibrary object
 */
function parseLibraryEvent(event: NostrEvent): StudioLibrary | null {
  try {
    const dTag = event.tags.find(([name]) => name === 'd')?.[1];
    if (!dTag || !dTag.startsWith(STUDIO_LIBRARY_D_PREFIX)) return null;

    const id = dTag.replace(STUDIO_LIBRARY_D_PREFIX, '');
    const name = event.tags.find(([name]) => name === 'name')?.[1] ?? 'Untitled Library';
    const description = event.tags.find(([name]) => name === 'description')?.[1];
    const coverImage = event.tags.find(([name]) => name === 'image')?.[1];

    // Images are stored as JSON in content
    let images: StudioImage[] = [];
    if (event.content) {
      try {
        images = JSON.parse(event.content);
      } catch {
        images = [];
      }
    }

    return {
      id,
      name,
      description,
      coverImage,
      images,
      pubkey: event.pubkey,
      createdAt: event.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Hook to query all studio libraries published by the admin
 */
export function useStudioLibraries() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['studio-libraries', adminPubkey],
    queryFn: async (c) => {
      if (!adminPubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [
          {
            kinds: [STUDIO_LIBRARY_KIND],
            authors: [adminPubkey],
            '#d': undefined,
            limit: 100,
          },
        ],
        { signal }
      );

      // Filter for studio library events
      const libraryEvents = events.filter((e) =>
        e.tags.some(([name, val]) => name === 'd' && val?.startsWith(STUDIO_LIBRARY_D_PREFIX))
      );

      return libraryEvents
        .map(parseLibraryEvent)
        .filter((lib): lib is StudioLibrary => lib !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 30_000,
  });
}

/**
 * Hook to create or update a studio library
 */
export function useCreateStudioLibrary() {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const mutate = (
    library: { id: string; name: string; description?: string; coverImage?: string; images: StudioImage[] },
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    const dTag = `${STUDIO_LIBRARY_D_PREFIX}${library.id}`;

    const tags: string[][] = [
      ['d', dTag],
      ['name', library.name],
      ['alt', `Pop Art Studio Library: ${library.name}`],
    ];

    if (library.description) {
      tags.push(['description', library.description]);
    }
    if (library.coverImage) {
      tags.push(['image', library.coverImage]);
    }

    createEvent(
      {
        kind: STUDIO_LIBRARY_KIND,
        content: JSON.stringify(library.images),
        tags,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['studio-libraries'] });
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

/**
 * Hook to delete a studio library (publishes an empty replacement)
 */
export function useDeleteStudioLibrary() {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const mutate = (
    libraryId: string,
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    const dTag = `${STUDIO_LIBRARY_D_PREFIX}${libraryId}`;

    // To "delete" an addressable event, we publish a new version with a delete marker
    createEvent(
      {
        kind: STUDIO_LIBRARY_KIND,
        content: '[]',
        tags: [
          ['d', dTag],
          ['name', '__deleted__'],
          ['alt', 'Deleted Pop Art Studio Library'],
          ['deleted', 'true'],
        ],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['studio-libraries'] });
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

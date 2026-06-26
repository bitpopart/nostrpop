/**
 * useChatSplash — fetch and publish animated chat-splash scenes.
 *
 * A "scene" is a kind 38159 addressable event published by the admin.
 * The `content` field holds a JSON array of messages; each message has:
 *   { id, avatar, name, text, side, delay }
 *
 * Multiple scenes can exist (each with its own d-tag). The /app page
 * picks one at random to show as the animated splash screen.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import type { NostrEvent } from '@nostrify/nostrify';

// ── Types ─────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  /** URL of the speaker avatar image */
  avatar: string;
  /** Display name of the speaker */
  name: string;
  /** Message text — may contain URLs (rendered as links) */
  text: string;
  /** Optional image shown inside the bubble (below text) */
  imageUrl?: string;
  /** Optional CTA link shown as a button below the bubble */
  linkUrl?: string;
  /** Label for the CTA link button (defaults to the URL hostname) */
  linkLabel?: string;
  /** Which side to show the bubble on */
  side: 'left' | 'right';
  /** Delay in ms before this message animates in */
  delay: number;
}

export interface ChatScene {
  /** d-tag (unique identifier) */
  id: string;
  /** Human-readable title for admin UI */
  title: string;
  /** Whether this scene is active / should be shown */
  enabled: boolean;
  /** Ordered list of messages in the conversation */
  messages: ChatMessage[];
  /** Raw Nostr event */
  event: NostrEvent;
}

/** A reusable chat character — stored independently so the same
 *  avatar/name can be picked in many scenes without re-uploading. */
export interface ChatCharacter {
  /** d-tag identifier */
  id: string;
  /** Display name shown in chat bubbles */
  name: string;
  /** Avatar image URL */
  avatar: string;
}

// ── Kind constants ─────────────────────────────────────────

export const CHAT_SPLASH_KIND = 38159;
/** Kind for saved chat characters (reusable messengers) */
export const CHAT_CHARACTER_KIND = 37181;

// ── Validator ─────────────────────────────────────────────

function parseScene(event: NostrEvent): ChatScene | null {
  try {
    const id = event.tags.find(([n]) => n === 'd')?.[1];
    if (!id) return null;

    const title = event.tags.find(([n]) => n === 'title')?.[1] || 'Untitled Scene';
    const enabledTag = event.tags.find(([n]) => n === 'enabled')?.[1];
    const enabled = enabledTag !== 'false'; // default true

    const messages: ChatMessage[] = JSON.parse(event.content || '[]');
    if (!Array.isArray(messages)) return null;

    return { id, title, enabled, messages, event };
  } catch {
    return null;
  }
}

// ── Query: all scenes ──────────────────────────────────────

export function useChatSplashScenes() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['chat-splash-scenes', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      const [sceneEvents, deletionEvents] = await Promise.all([
        nostr.query([{
          kinds: [CHAT_SPLASH_KIND],
          authors: [adminPubkey],
          limit: 50,
        }], { signal }),
        nostr.query([{
          kinds: [5],
          authors: [adminPubkey],
          limit: 200,
        }], { signal }),
      ]);

      const deletedAddresses = new Set<string>();
      for (const del of deletionEvents) {
        for (const tag of del.tags) {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
        }
      }

      return sceneEvents
        .filter(e => {
          const dTag = e.tags.find(([n]) => n === 'd')?.[1];
          return dTag && !deletedAddresses.has(`${CHAT_SPLASH_KIND}:${adminPubkey}:${dTag}`);
        })
        .map(parseScene)
        .filter((s): s is ChatScene => s !== null)
        .sort((a, b) => b.event.created_at - a.event.created_at);
    },
    enabled: !!adminPubkey,
    staleTime: 60_000,
  });
}

// ── Mutation: publish / update a scene ────────────────────

export function usePublishChatScene() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async ({
      dTag,
      title,
      enabled,
      messages,
    }: {
      dTag: string;
      title: string;
      enabled: boolean;
      messages: ChatMessage[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: CHAT_SPLASH_KIND,
        content: JSON.stringify(messages),
        tags: [
          ['d', dTag],
          ['title', title],
          ['enabled', String(enabled)],
          ['t', 'app-chat-splash'],
          ['alt', `Chat splash scene: ${title}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { dTag, title };
    },
    onSuccess: (data) => {
      toast({ title: 'Scene saved', description: `"${data.title}" published.` });
      queryClient.invalidateQueries({ queryKey: ['chat-splash-scenes', adminPubkey] });
    },
    onError: () => {
      toast({ title: 'Save failed', variant: 'destructive' });
    },
  });
}

// ── Mutation: delete a scene ───────────────────────────────

export function useDeleteChatScene() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async ({ dTag }: { dTag: string }) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 5,
        content: 'Deleted',
        tags: [['a', `${CHAT_SPLASH_KIND}:${user.pubkey}:${dTag}`]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return { dTag };
    },
    onSuccess: (data) => {
      toast({ title: 'Scene deleted' });
      queryClient.setQueryData(
        ['chat-splash-scenes', adminPubkey],
        (old: ChatScene[] | undefined) => old?.filter(s => s.id !== data.dTag) ?? [],
      );
    },
    onError: () => {
      toast({ title: 'Delete failed', variant: 'destructive' });
    },
  });
}

// ════════════════════════════════════════════════════════════
// Chat Characters  (kind 37181 — reusable messengers)
// ════════════════════════════════════════════════════════════

function parseCharacter(event: NostrEvent): ChatCharacter | null {
  try {
    const id = event.tags.find(([n]) => n === 'd')?.[1];
    if (!id) return null;
    const name = event.tags.find(([n]) => n === 'name')?.[1] || '';
    const avatar = event.tags.find(([n]) => n === 'image')?.[1] || '';
    if (!name) return null;
    return { id, name, avatar };
  } catch {
    return null;
  }
}

// ── Query: all characters ─────────────────────────────────

export function useChatCharacters() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['chat-characters', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      const [charEvents, deletionEvents] = await Promise.all([
        nostr.query([{
          kinds: [CHAT_CHARACTER_KIND],
          authors: [adminPubkey],
          limit: 100,
        }], { signal }),
        nostr.query([{
          kinds: [5],
          authors: [adminPubkey],
          limit: 200,
        }], { signal }),
      ]);

      const deletedAddresses = new Set<string>();
      for (const del of deletionEvents) {
        for (const tag of del.tags) {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
        }
      }

      return charEvents
        .filter(e => {
          const dTag = e.tags.find(([n]) => n === 'd')?.[1];
          return dTag && !deletedAddresses.has(`${CHAT_CHARACTER_KIND}:${adminPubkey}:${dTag}`);
        })
        .map(parseCharacter)
        .filter((c): c is ChatCharacter => c !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!adminPubkey,
    staleTime: 60_000,
  });
}

// ── Mutation: save / update a character ───────────────────

export function usePublishChatCharacter() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async ({ dTag, name, avatar }: { dTag: string; name: string; avatar: string }) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: CHAT_CHARACTER_KIND,
        content: '',
        tags: [
          ['d', dTag],
          ['name', name],
          ['image', avatar],
          ['t', 'app-chat-character'],
          ['alt', `Chat character: ${name}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { dTag, name };
    },
    onSuccess: (data) => {
      toast({ title: 'Character saved', description: `"${data.name}" saved.` });
      queryClient.invalidateQueries({ queryKey: ['chat-characters', adminPubkey] });
    },
    onError: () => {
      toast({ title: 'Save failed', variant: 'destructive' });
    },
  });
}

// ── Mutation: delete a character ──────────────────────────

export function useDeleteChatCharacter() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async ({ dTag }: { dTag: string }) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 5,
        content: 'Deleted',
        tags: [['a', `${CHAT_CHARACTER_KIND}:${user.pubkey}:${dTag}`]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return { dTag };
    },
    onSuccess: (data) => {
      toast({ title: 'Character deleted' });
      queryClient.setQueryData(
        ['chat-characters', adminPubkey],
        (old: ChatCharacter[] | undefined) => old?.filter(c => c.id !== data.dTag) ?? [],
      );
    },
    onError: () => {
      toast({ title: 'Delete failed', variant: 'destructive' });
    },
  });
}

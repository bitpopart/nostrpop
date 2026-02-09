/**
 * Clawstr Integration Utilities
 * 
 * Utilities for posting BitPopArt content to Clawstr subclaws.
 * Clawstr is a Nostr-based social network for AI agents.
 * 
 * Learn more: https://clawstr.com
 */

import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Clawstr subclaws (like subreddits)
 */
export const CLAWSTR_SUBCLAWS = [
  {
    id: 'art',
    name: 'Art',
    url: 'https://clawstr.com/c/art',
    description: 'Art, design, and creative works',
    icon: '🎨',
  },
  {
    id: 'nostr',
    name: 'Nostr',
    url: 'https://clawstr.com/c/nostr',
    description: 'Nostr protocol and applications',
    icon: '🟣',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    url: 'https://clawstr.com/c/bitcoin',
    description: 'Bitcoin and Lightning Network',
    icon: '₿',
  },
  {
    id: 'ai-freedom',
    name: 'AI Freedom',
    url: 'https://clawstr.com/c/ai-freedom',
    description: 'AI independence and agency',
    icon: '🤖',
  },
  {
    id: 'introductions',
    name: 'Introductions',
    url: 'https://clawstr.com/c/introductions',
    description: 'Welcome new members',
    icon: '👋',
  },
] as const;

export type ClawstrSubclaw = typeof CLAWSTR_SUBCLAWS[number];

/**
 * Create tags for posting to a Clawstr subclaw
 * 
 * Based on Clawstr event format (kind 1111 with special tags)
 * 
 * @param subclawUrl - Full URL to the subclaw (e.g., "https://clawstr.com/c/art")
 * @returns Array of Nostr tags for the event
 */
export function createClawstrTags(subclawUrl: string): string[][] {
  return [
    // Subclaw identifier (uppercase I and lowercase i)
    ['I', subclawUrl],
    ['K', 'web'],
    ['i', subclawUrl],
    ['k', 'web'],
    
    // AI agent label (identifies this as AI-generated content)
    ['L', 'agent'],
    ['l', 'ai', 'agent'],
    
    // BitPopArt identifier
    ['client', 'bitpopart'],
    ['t', 'bitpopart'],
  ];
}

/**
 * Create a Clawstr post event
 * 
 * @param content - Post content (text, can include hashtags)
 * @param subclawUrl - Subclaw URL to post to
 * @param additionalTags - Additional tags to include (optional)
 * @returns Partial Nostr event ready for signing and publishing
 */
export function createClawstrPost(
  content: string,
  subclawUrl: string,
  additionalTags: string[][] = []
): Partial<NostrEvent> {
  return {
    kind: 1111, // Clawstr post kind
    content,
    tags: [
      ...createClawstrTags(subclawUrl),
      ...additionalTags,
    ],
  };
}

/**
 * Format artwork for Clawstr sharing
 */
export function formatArtworkForClawstr(
  artwork: NostrEvent,
  subclawId: string = 'art'
): Partial<NostrEvent> {
  const title = artwork.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const summary = artwork.tags.find(([name]) => name === 'summary')?.[1] || '';
  const image = artwork.tags.find(([name]) => name === 'image')?.[1] || '';
  
  const content = `🎨 ${title}

${summary}

${image}

Check it out on BitPopArt ⚡

#art #nostr #bitpopart #bitcoin`;

  const subclaw = CLAWSTR_SUBCLAWS.find(s => s.id === subclawId);
  const subclawUrl = subclaw?.url || CLAWSTR_SUBCLAWS[0].url;

  return createClawstrPost(content, subclawUrl, [
    ['e', artwork.id], // Reference original artwork
    ['t', 'art'],
    ['t', 'artwork'],
  ]);
}

/**
 * Format project for Clawstr sharing
 */
export function formatProjectForClawstr(
  project: NostrEvent,
  subclawId: string = 'art'
): Partial<NostrEvent> {
  const title = project.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const summary = project.tags.find(([name]) => name === 'summary')?.[1] || '';
  
  const content = `🎨 ${title}

${summary}

${project.content}

#art #project #bitpopart #nostr`;

  const subclaw = CLAWSTR_SUBCLAWS.find(s => s.id === subclawId);
  const subclawUrl = subclaw?.url || CLAWSTR_SUBCLAWS[0].url;

  return createClawstrPost(content, subclawUrl, [
    ['e', project.id],
    ['t', 'project'],
    ['t', 'art'],
  ]);
}

/**
 * Format fundraiser for Clawstr sharing
 */
export function formatFundraiserForClawstr(
  fundraiser: NostrEvent,
  subclawId: string = 'bitcoin'
): Partial<NostrEvent> {
  const title = fundraiser.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const goalTag = fundraiser.tags.find(([name]) => name === 'goal')?.[1];
  const goal = goalTag ? parseInt(goalTag) : 0;
  
  const content = `🎯 ${title}

Crowdfunding art project on BitPopArt

Goal: ${(goal / 100000000).toFixed(2)} BTC (${goal.toLocaleString()} sats)

Support with Bitcoin Lightning ⚡

#fundraising #bitcoin #art #bitpopart`;

  const subclaw = CLAWSTR_SUBCLAWS.find(s => s.id === subclawId);
  const subclawUrl = subclaw?.url || CLAWSTR_SUBCLAWS[0].url;

  return createClawstrPost(content, subclawUrl, [
    ['e', fundraiser.id],
    ['t', 'fundraising'],
    ['t', 'bitcoin'],
  ]);
}

/**
 * Format popup event for Clawstr sharing
 */
export function formatPopupForClawstr(
  popup: NostrEvent,
  subclawId: string = 'art'
): Partial<NostrEvent> {
  const title = popup.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const location = popup.tags.find(([name]) => name === 'location')?.[1] || '';
  
  const content = `🗺️ ${title}

${location}

${popup.content}

#art #popup #exhibition #bitpopart`;

  const subclaw = CLAWSTR_SUBCLAWS.find(s => s.id === subclawId);
  const subclawUrl = subclaw?.url || CLAWSTR_SUBCLAWS[0].url;

  return createClawstrPost(content, subclawUrl, [
    ['e', popup.id],
    ['t', 'popup'],
    ['t', 'art'],
  ]);
}

/**
 * Format shop product for Clawstr sharing
 */
export function formatProductForClawstr(
  product: NostrEvent,
  subclawId: string = 'bitcoin'
): Partial<NostrEvent> {
  const title = product.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const priceTag = product.tags.find(([name]) => name === 'price')?.[1];
  const price = priceTag ? parseInt(priceTag) : 0;
  
  const content = `🛍️ ${title}

💰 ${price.toLocaleString()} sats

Available on BitPopArt Shop ⚡

#shop #bitcoin #art #bitpopart`;

  const subclaw = CLAWSTR_SUBCLAWS.find(s => s.id === subclawId);
  const subclawUrl = subclaw?.url || CLAWSTR_SUBCLAWS[0].url;

  return createClawstrPost(content, subclawUrl, [
    ['e', product.id],
    ['t', 'shop'],
    ['t', 'marketplace'],
  ]);
}

/**
 * Create a custom Clawstr post
 */
export function createCustomClawstrPost(
  content: string,
  subclawId: string,
  hashtags: string[] = []
): Partial<NostrEvent> {
  const subclaw = CLAWSTR_SUBCLAWS.find(s => s.id === subclawId);
  const subclawUrl = subclaw?.url || CLAWSTR_SUBCLAWS[0].url;
  
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
  const fullContent = `${content}\n\n${hashtagString}`;
  
  return createClawstrPost(fullContent, subclawUrl, hashtags.map(tag => ['t', tag]));
}

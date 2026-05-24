import type { NostrEvent } from '@nostrify/nostrify';

export type GameMode = 'indoor' | 'outdoor' | 'both';

export interface ProjectData {
  id: string;
  event?: NostrEvent;
  name: string;
  description: string;
  thumbnail: string;
  url?: string;
  author_pubkey: string;
  created_at: string;
  order?: number; // Display order
  featured?: boolean; // Show on homepage
  coming_soon?: boolean; // Shows thumbnail only, no link
  brand_site?: string; // Optional extra site/page URL
  game_mode?: GameMode; // For games: indoor, outdoor, or both
}

/**
 * Generate UUID v4
 */
export function generateProjectUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

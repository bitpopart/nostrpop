import type { NostrEvent } from '@nostrify/nostrify';

/**
 * General Page - Custom pages for the website
 * Kind: 38175 (addressable)
 */
export interface PageData {
  id: string; // d tag identifier (URL slug)
  event?: NostrEvent;
  title: string;
  description: string;
  header_image?: string; // Optional header/hero image
  gallery_images: string[]; // Array of gallery images
  external_url?: string; // Optional external link
  author_pubkey: string;
  created_at: string;
  show_in_footer: boolean; // Show link in footer
  order?: number; // Display order in footer
}

/**
 * Social Media Link
 * Kind: 38176 (addressable)
 */
export interface SocialMediaLink {
  id: string; // Platform identifier (e.g., 'twitter', 'instagram')
  event?: NostrEvent;
  platform: string; // Platform name (Twitter, Instagram, etc.)
  icon: string; // Icon identifier or emoji
  url: string; // Full URL to profile
  author_pubkey: string;
  order?: number; // Display order
}

/**
 * Newsletter Subscription
 * Kind: 38177 (regular)
 */
export interface NewsletterSubscription {
  email: string;
  npub?: string; // Optional Nostr npub
  subscribed_at: string;
  event?: NostrEvent;
}

/**
 * Generate UUID v4
 */
export function generatePageUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

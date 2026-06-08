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
  brand_site?: string; // Optional project website URL, or inline HTML content
  brand_site_inline?: boolean; // If true, embed brand_site as iframe instead of button
  /** True when brand_site contains raw HTML to be used as iframe srcdoc (not a URL) */
  brand_site_is_srcdoc?: boolean;
  author_pubkey: string;
  created_at: string;
  show_in_footer: boolean; // Show link in footer
  order?: number; // Display order in footer
  /** If true, shows a floating ⚡ Zap button on the page */
  show_zap_button?: boolean;
  /** If set, shows a floating "Buy Me a Coffee" button linking to this URL */
  buy_me_coffee_url?: string;
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

import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Fundraiser - Crowdfunding campaign for art projects
 * Kind: 38178 (addressable)
 */
export interface FundraiserData {
  id: string; // d tag identifier
  event?: NostrEvent;
  title: string;
  description: string;
  goal_sats: number; // Fundraising goal in sats
  raised_sats?: number; // Calculated from contributions
  thumbnail: string; // Project image
  author_pubkey: string;
  created_at: string;
  deadline?: string; // Optional deadline date
  status: 'active' | 'completed' | 'cancelled';
  external_url?: string; // Optional URL to an external fundraising site
  project_url?: string; // Optional in-site URL (bitpopart.com page) — "More about the project"
  tiers?: FundraiserTier[]; // Optional supporter/reward tiers
}

/**
 * Fundraiser supporter tier.
 * A tier is either free-form support ("just send some sats") or a priced
 * product/reward paid in sats (e.g. "Buy a BitBot — €210, pay in sats").
 */
export interface FundraiserTier {
  id: string; // unique id within the campaign
  name: string; // e.g. "Just support" or "Buy a BitBot"
  description?: string; // optional supporting text
  price_eur?: number; // optional EUR price — converted to sats live on the card
  product_url?: string; // optional link to the product page (e.g. bitpopart.com/bitbot)
}

/**
 * Fundraiser Contribution
 * Kind: 38179 (regular)
 */
export interface FundraiserContribution {
  fundraiser_id: string; // References the fundraiser d tag
  contributor_npub: string;
  contributor_name?: string;
  amount_sats: number;
  message?: string; // Optional message from contributor
  payment_proof?: string; // Lightning invoice/payment proof
  contributed_at: string;
  event?: NostrEvent;
}

/**
 * Generate UUID v4
 */
export function generateFundraiserUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format sats with commas
 */
export function formatSats(sats: number): string {
  return sats.toLocaleString();
}

/**
 * Calculate percentage of goal
 */
export function calculateProgress(raised: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

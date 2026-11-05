import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Where a campaign actually collects donations.
 * - 'internal': sats are raised here on BitPopArt (goal in sats, progress bar,
 *   Lightning contribution dialog on the card).
 * - 'external': the fundraising lives on an external site - the card links out
 *   (opens in a new tab) and has no internal goal/progress.
 */
export type FundingMode = 'internal' | 'external';

/**
 * Fundraiser - Crowdfunding campaign for art projects
 * Kind: 38178 (addressable)
 */
export interface FundraiserData {
  id: string; // d tag identifier
  event?: NostrEvent;
  title: string;
  description: string;
  goal_sats: number; // Fundraising goal in sats (0 for external-page campaigns)
  raised_sats?: number; // Calculated from contributions
  thumbnail: string; // Project image
  author_pubkey: string;
  created_at: string;
  deadline?: string; // Optional deadline date
  status: 'active' | 'completed' | 'cancelled';
  funding_mode?: FundingMode; // Where the fundraising happens (default 'internal')
  external_url?: string; // URL to an external fundraising page - opens in a new tab
  project_url?: string; // Optional in-site URL (bitpopart.com page) - "More about the project"
  tiers?: FundraiserTier[]; // Optional supporter/reward tiers
}

/**
 * Legacy-aware external-mode detection.
 * A campaign counts as external when its stored mode says so, or (for
 * campaigns saved before the mode existed) when it only has an external page
 * URL and no positive internal sats goal.
 */
export function isExternalFundraiser(f: {
  funding_mode?: FundingMode | string;
  external_url?: string;
  goal_sats?: number;
}): boolean {
  if (f.funding_mode === 'external') return true;
  if (f.funding_mode === 'internal') return false;
  return Boolean(f.external_url) && !(f.goal_sats && f.goal_sats > 0);
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

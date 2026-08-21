import { nip19 } from 'nostr-tools';

// BitPopArt admin npub (bitpopart)
const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';

// BitPopArt's operator pubkeys that are authoritative for site content.
// ⚠️ Keep this in sync with the "real" publishing keys. Pages (kind 38175)
// may be published from more than one key — the site reads from every key
// listed here and serves the newest version of each page (see usePages.tsx).
const PRIMARY_OWNER_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c'; // npub1gwa27... (site admin/content key)
const ARTIST_OWNER_PUBKEY = '7d33ba57d8a6e8869a1f1d5215254597594ac0dbfeb01b690def8c461b82db35'; // npub105em547c5m... (artist key, site founder/author)

/** Pubkeys whose custom pages (kind 38175) the site treats as authoritative. */
export const PAGE_OWNER_PUBKEYS: string[] = [
  PRIMARY_OWNER_PUBKEY,
  ARTIST_OWNER_PUBKEY,
];

// Convert npub to hex format for comparison
let ADMIN_PUBKEY_HEX: string;
try {
  const decoded = nip19.decode(ADMIN_NPUB);
  if (decoded.type === 'npub') {
    ADMIN_PUBKEY_HEX = decoded.data;
  } else {
    throw new Error('Invalid npub format');
  }
} catch (error) {
  console.error('Failed to decode admin npub:', error);
  // Fallback to empty string to ensure no one gets admin access if decoding fails
  ADMIN_PUBKEY_HEX = '';
}

/**
 * Check if a user pubkey (in hex format) belongs to the admin
 * @param userPubkey - User's public key in hex format
 * @returns true if the user is the admin, false otherwise
 */
export function isAdminUser(userPubkey: string | undefined): boolean {
  if (!userPubkey || !ADMIN_PUBKEY_HEX) {
    return false;
  }

  // Compare hex pubkeys (case-insensitive)
  const isAdmin = userPubkey.toLowerCase() === ADMIN_PUBKEY_HEX.toLowerCase();

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Admin check:', {
      userPubkey: userPubkey.slice(0, 8) + '...',
      adminPubkey: ADMIN_PUBKEY_HEX.slice(0, 8) + '...',
      isAdmin,
      adminNpub: ADMIN_NPUB
    });
  }

  return isAdmin;
}

/**
 * Get the admin npub for display purposes
 */
export function getAdminNpub(): string {
  return ADMIN_NPUB;
}

/**
 * Get the admin pubkey in hex format
 */
export function getAdminPubkeyHex(): string {
  return ADMIN_PUBKEY_HEX;
}
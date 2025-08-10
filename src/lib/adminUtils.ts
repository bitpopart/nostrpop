import { nip19 } from 'nostr-tools';

// BitPopArt admin npub
const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';

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
import { describe, it, expect } from 'vitest';
import { isAdminUser, getAdminNpub, getAdminPubkeyHex } from './adminUtils';
import { nip19 } from 'nostr-tools';

describe('adminUtils', () => {
  const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';

  // Decode the admin npub to get the expected hex pubkey
  const adminDecoded = nip19.decode(ADMIN_NPUB);
  const ADMIN_HEX = adminDecoded.type === 'npub' ? adminDecoded.data : '';

  describe('isAdminUser', () => {
    it('should return true for the correct admin pubkey', () => {
      expect(isAdminUser(ADMIN_HEX)).toBe(true);
    });

    it('should return true for the correct admin pubkey regardless of case', () => {
      expect(isAdminUser(ADMIN_HEX.toLowerCase())).toBe(true);
      expect(isAdminUser(ADMIN_HEX.toUpperCase())).toBe(true);
    });

    it('should return false for a different pubkey', () => {
      const differentPubkey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isAdminUser(differentPubkey)).toBe(false);
    });

    it('should return false for undefined pubkey', () => {
      expect(isAdminUser(undefined)).toBe(false);
    });

    it('should return false for empty string pubkey', () => {
      expect(isAdminUser('')).toBe(false);
    });

    it('should return false for null pubkey', () => {
      expect(isAdminUser(null as unknown as string)).toBe(false);
    });
  });

  describe('getAdminNpub', () => {
    it('should return the correct admin npub', () => {
      expect(getAdminNpub()).toBe(ADMIN_NPUB);
    });
  });

  describe('getAdminPubkeyHex', () => {
    it('should return the correct admin pubkey in hex format', () => {
      expect(getAdminPubkeyHex()).toBe(ADMIN_HEX);
    });

    it('should return a valid hex string', () => {
      const hex = getAdminPubkeyHex();
      expect(hex).toMatch(/^[0-9a-f]{64}$/i);
    });
  });

  describe('npub to hex conversion', () => {
    it('should correctly convert the admin npub to hex', () => {
      const decoded = nip19.decode(ADMIN_NPUB);
      expect(decoded.type).toBe('npub');
      expect(decoded.data).toBe(ADMIN_HEX);
    });
  });
});
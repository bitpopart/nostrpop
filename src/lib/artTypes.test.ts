import { describe, it, expect } from 'vitest';
import {
  getArtworksByFilter,
  getArtworkById,
  formatPrice,
  isAuctionActive,
  getTimeRemaining,
  SAMPLE_ARTWORKS
} from './artTypes';

describe('artTypes', () => {
  describe('getArtworksByFilter', () => {
    it('should return all artworks when filter is "all"', () => {
      const result = getArtworksByFilter('all');
      expect(result).toHaveLength(SAMPLE_ARTWORKS.length);
      expect(result).toEqual(SAMPLE_ARTWORKS);
    });

    it('should return only artworks for sale when filter is "for_sale"', () => {
      const result = getArtworksByFilter('for_sale');
      const expected = SAMPLE_ARTWORKS.filter(artwork => artwork.sale_type === 'fixed');
      expect(result).toEqual(expected);
      expect(result.every(artwork => artwork.sale_type === 'fixed')).toBe(true);
    });

    it('should return only auction artworks when filter is "auction"', () => {
      const result = getArtworksByFilter('auction');
      const expected = SAMPLE_ARTWORKS.filter(artwork => artwork.sale_type === 'auction');
      expect(result).toEqual(expected);
      expect(result.every(artwork => artwork.sale_type === 'auction')).toBe(true);
    });

    it('should return only sold artworks when filter is "sold"', () => {
      const result = getArtworksByFilter('sold');
      const expected = SAMPLE_ARTWORKS.filter(artwork => artwork.sale_type === 'sold');
      expect(result).toEqual(expected);
      expect(result.every(artwork => artwork.sale_type === 'sold')).toBe(true);
    });
  });

  describe('getArtworkById', () => {
    it('should return the correct artwork by ID', () => {
      const artwork = getArtworkById('art-1');
      expect(artwork).toBeDefined();
      expect(artwork?.id).toBe('art-1');
      expect(artwork?.title).toBe('Digital Sunset');
    });

    it('should return undefined for non-existent ID', () => {
      const artwork = getArtworkById('non-existent');
      expect(artwork).toBeUndefined();
    });
  });

  describe('formatPrice', () => {
    it('should format BTC prices correctly', () => {
      expect(formatPrice(0.001, 'BTC')).toBe('₿0.001000');
      expect(formatPrice(0.000001, 'BTC')).toBe('₿0.000001');
    });

    it('should format SAT prices correctly', () => {
      expect(formatPrice(100000, 'SAT')).toBe('100,000 sats');
      expect(formatPrice(1000, 'SAT')).toBe('1,000 sats');
    });

    it('should format USD prices correctly', () => {
      expect(formatPrice(100.50, 'USD')).toBe('100.50 USD');
      expect(formatPrice(1000, 'USD')).toBe('1000.00 USD');
    });

    it('should format other currencies correctly', () => {
      expect(formatPrice(50.75, 'EUR')).toBe('50.75 EUR');
      expect(formatPrice(25, 'GBP')).toBe('25.00 GBP');
    });
  });

  describe('isAuctionActive', () => {
    it('should return false for non-auction artworks', () => {
      const artwork = {
        sale_type: 'fixed' as const,
        auction_end: undefined,
        id: 'test',
        title: 'Test',
        description: 'Test',
        images: [],
        artist_pubkey: 'test',
        created_at: new Date().toISOString()
      };
      expect(isAuctionActive(artwork)).toBe(false);
    });

    it('should return false for auction without end time', () => {
      const artwork = {
        sale_type: 'auction' as const,
        auction_end: undefined,
        id: 'test',
        title: 'Test',
        description: 'Test',
        images: [],
        artist_pubkey: 'test',
        created_at: new Date().toISOString()
      };
      expect(isAuctionActive(artwork)).toBe(false);
    });

    it('should return true for active auction', () => {
      const futureTime = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
      const artwork = {
        sale_type: 'auction' as const,
        auction_end: futureTime,
        id: 'test',
        title: 'Test',
        description: 'Test',
        images: [],
        artist_pubkey: 'test',
        created_at: new Date().toISOString()
      };
      expect(isAuctionActive(artwork)).toBe(true);
    });

    it('should return false for ended auction', () => {
      const pastTime = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const artwork = {
        sale_type: 'auction' as const,
        auction_end: pastTime,
        id: 'test',
        title: 'Test',
        description: 'Test',
        images: [],
        artist_pubkey: 'test',
        created_at: new Date().toISOString()
      };
      expect(isAuctionActive(artwork)).toBe(false);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return "Auction ended" for past times', () => {
      const pastTime = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      expect(getTimeRemaining(pastTime)).toBe('Auction ended');
    });

    it('should return days and hours for long durations', () => {
      const futureTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(); // 2 days 3 hours
      const result = getTimeRemaining(futureTime);
      expect(result).toMatch(/2d \d+h/);
    });

    it('should return hours and minutes for medium durations', () => {
      const futureTime = new Date(Date.now() + 3 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(); // 3 hours 30 minutes
      const result = getTimeRemaining(futureTime);
      expect(result).toMatch(/3h 30m/);
    });

    it('should return minutes for short durations', () => {
      const futureTime = new Date(Date.now() + 45 * 60 * 1000).toISOString(); // 45 minutes
      const result = getTimeRemaining(futureTime);
      expect(result).toBe('45m');
    });
  });

  describe('SAMPLE_ARTWORKS', () => {
    it('should have the expected number of sample artworks', () => {
      expect(SAMPLE_ARTWORKS).toHaveLength(6);
    });

    it('should have artworks with different sale types', () => {
      const saleTypes = SAMPLE_ARTWORKS.map(artwork => artwork.sale_type);
      expect(saleTypes).toContain('fixed');
      expect(saleTypes).toContain('auction');
      expect(saleTypes).toContain('sold');
      expect(saleTypes).toContain('not_for_sale');
    });

    it('should have all required fields for each artwork', () => {
      SAMPLE_ARTWORKS.forEach(artwork => {
        expect(artwork.id).toBeDefined();
        expect(artwork.title).toBeDefined();
        expect(artwork.description).toBeDefined();
        expect(artwork.images).toBeDefined();
        expect(artwork.artist_pubkey).toBeDefined();
        expect(artwork.created_at).toBeDefined();
        expect(artwork.sale_type).toBeDefined();
      });
    });
  });
});
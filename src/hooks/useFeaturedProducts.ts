/**
 * useFeaturedProducts
 *
 * Persists a list of featured product IDs (pinned to the top of /shop) in localStorage.
 * The admin picks which product thumbnails appear first when the /shop page opens.
 */

import { useState, useCallback } from 'react';

const FEATURED_KEY = 'nostrpop_featured_products';

function loadFeatured(): string[] {
  try {
    const raw = localStorage.getItem(FEATURED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFeatured(ids: string[]) {
  localStorage.setItem(FEATURED_KEY, JSON.stringify(ids));
}

export function useFeaturedProducts() {
  const [featuredIds, setFeaturedIds] = useState<string[]>(loadFeatured);

  /** Toggle a product's featured status */
  const toggleFeatured = useCallback((id: string) => {
    setFeaturedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveFeatured(next);
      return next;
    });
  }, []);

  /** Move a product up in the featured list */
  const moveUp = useCallback((id: string) => {
    setFeaturedIds(prev => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      saveFeatured(next);
      return next;
    });
  }, []);

  /** Move a product down in the featured list */
  const moveDown = useCallback((id: string) => {
    setFeaturedIds(prev => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      saveFeatured(next);
      return next;
    });
  }, []);

  /** Replace the full featured list (e.g. from drag-reorder) */
  const setFeatured = useCallback((ids: string[]) => {
    saveFeatured(ids);
    setFeaturedIds(ids);
  }, []);

  /** Remove all featured products */
  const clearFeatured = useCallback(() => {
    saveFeatured([]);
    setFeaturedIds([]);
  }, []);

  return {
    featuredIds,
    toggleFeatured,
    moveUp,
    moveDown,
    setFeatured,
    clearFeatured,
  };
}

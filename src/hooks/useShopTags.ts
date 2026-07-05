import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

const SHOP_TAGS_KEY = 'nostrpop_shop_tags';

function readTags(): string[] {
  try {
    const stored = localStorage.getItem(SHOP_TAGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeTags(tags: string[]) {
  localStorage.setItem(SHOP_TAGS_KEY, JSON.stringify(tags));
  window.dispatchEvent(new CustomEvent('shop-tags-updated'));
}

/**
 * Manages the admin-curated tag library stored in localStorage.
 * These tags appear as quick-add chips in the product forms
 * and serve as the "master list" for the shop's tag cloud.
 */
export function useShopTags() {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>(readTags);

  // Re-sync when another component updates tags
  useEffect(() => {
    const handler = () => setTags(readTags());
    window.addEventListener('shop-tags-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('shop-tags-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!tag) return false;
    const current = readTags();
    if (current.includes(tag)) {
      toast({ title: 'Tag already exists', description: `#${tag} is already in your tag library.`, variant: 'destructive' });
      return false;
    }
    const updated = [...current, tag].sort();
    writeTags(updated);
    setTags(updated);
    toast({ title: 'Tag Added', description: `#${tag} added to your tag library.` });
    return true;
  }, [toast]);

  const deleteTag = useCallback((tag: string) => {
    const current = readTags();
    const updated = current.filter(t => t !== tag);
    writeTags(updated);
    setTags(updated);
    toast({ title: 'Tag Removed', description: `#${tag} removed from your tag library.` });
  }, [toast]);

  const renameTag = useCallback((oldTag: string, newRaw: string) => {
    const newTag = newRaw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!newTag || newTag === oldTag) return false;
    const current = readTags();
    if (current.includes(newTag)) {
      toast({ title: 'Tag already exists', description: `#${newTag} is already in your library.`, variant: 'destructive' });
      return false;
    }
    const updated = current.map(t => (t === oldTag ? newTag : t)).sort();
    writeTags(updated);
    setTags(updated);
    toast({ title: 'Tag Renamed', description: `#${oldTag} → #${newTag}` });
    return true;
  }, [toast]);

  return { tags, addTag, deleteTag, renameTag };
}

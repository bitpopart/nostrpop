import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

const SHOP_TAGS_KEY = 'nostrpop_shop_tags';

export interface ShopTag {
  tag: string;
  /** Whether this tag is shown in the shop frontend tag cloud */
  visible: boolean;
}

function readTags(): ShopTag[] {
  try {
    const stored = localStorage.getItem(SHOP_TAGS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Migrate old format (plain string[]) to ShopTag[]
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      const migrated: ShopTag[] = (parsed as string[]).map(t => ({ tag: t, visible: true }));
      localStorage.setItem(SHOP_TAGS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed as ShopTag[];
  } catch {
    return [];
  }
}

function writeTags(tags: ShopTag[]) {
  localStorage.setItem(SHOP_TAGS_KEY, JSON.stringify(tags));
  window.dispatchEvent(new CustomEvent('shop-tags-updated'));
}

/**
 * Manages the admin-curated tag library stored in localStorage.
 * Each tag has a `visible` flag that controls whether it shows
 * in the shop frontend tag cloud.
 */
export function useShopTags() {
  const { toast } = useToast();
  const [tags, setTags] = useState<ShopTag[]>(readTags);

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
    if (current.find(t => t.tag === tag)) {
      toast({ title: 'Tag already exists', description: `#${tag} is already in your tag library.`, variant: 'destructive' });
      return false;
    }
    const updated = [...current, { tag, visible: true }].sort((a, b) => a.tag.localeCompare(b.tag));
    writeTags(updated);
    setTags(updated);
    toast({ title: 'Tag Added', description: `#${tag} added to your tag library.` });
    return true;
  }, [toast]);

  const deleteTag = useCallback((tag: string) => {
    const current = readTags();
    const updated = current.filter(t => t.tag !== tag);
    writeTags(updated);
    setTags(updated);
    toast({ title: 'Tag Removed', description: `#${tag} removed from your tag library.` });
  }, [toast]);

  const renameTag = useCallback((oldTag: string, newRaw: string) => {
    const newTag = newRaw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!newTag || newTag === oldTag) return false;
    const current = readTags();
    if (current.find(t => t.tag === newTag)) {
      toast({ title: 'Tag already exists', description: `#${newTag} is already in your library.`, variant: 'destructive' });
      return false;
    }
    const updated = current
      .map(t => t.tag === oldTag ? { ...t, tag: newTag } : t)
      .sort((a, b) => a.tag.localeCompare(b.tag));
    writeTags(updated);
    setTags(updated);
    toast({ title: 'Tag Renamed', description: `#${oldTag} → #${newTag}` });
    return true;
  }, [toast]);

  const toggleVisibility = useCallback((tag: string) => {
    const current = readTags();
    const updated = current.map(t => t.tag === tag ? { ...t, visible: !t.visible } : t);
    writeTags(updated);
    setTags(updated);
  }, []);

  /** Only the tag strings (for quick-add chips in product forms) */
  const tagNames = tags.map(t => t.tag);

  /** Only tags marked visible — used in shop frontend tag cloud */
  const visibleTags = tags.filter(t => t.visible);

  return { tags, tagNames, visibleTags, addTag, deleteTag, renameTag, toggleVisibility };
}

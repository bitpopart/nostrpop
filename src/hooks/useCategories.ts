import { useState, useEffect, useCallback } from 'react';
import { getAllCategories as getDefaultCategories } from '@/config/categories';
import { useToast } from '@/hooks/useToast';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  featured?: boolean;
}

const CATEGORIES_STORAGE_KEY = 'nostrpop_categories';
const FEATURED_STORAGE_KEY = 'nostrpop_featured_categories';

function readCategories(): ProductCategory[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!stored) return getDefaultCategories();
    const parsed: ProductCategory[] = JSON.parse(stored);
    // Merge in any default categories that are missing (e.g. Buttons, Stickers added later)
    const defaults = getDefaultCategories();
    let merged = [...parsed];
    let changed = false;
    for (const def of defaults) {
      if (!merged.find(c => c.id === def.id)) {
        merged.push(def);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return getDefaultCategories();
  }
}

function readFeaturedIds(): string[] {
  try {
    const stored = localStorage.getItem(FEATURED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeCategories(cats: ProductCategory[]) {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
  // Notify all other instances in this tab
  window.dispatchEvent(new CustomEvent('categories-updated'));
}

export function useCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>(readCategories);
  const [featuredCategoryIds, setFeaturedCategoryIds] = useState<string[]>(readFeaturedIds);

  // Re-sync from localStorage when another instance writes
  useEffect(() => {
    const handler = () => setCategories(readCategories());
    window.addEventListener('categories-updated', handler);
    window.addEventListener('storage', handler); // cross-tab
    return () => {
      window.removeEventListener('categories-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Persist featured ids whenever they change
  useEffect(() => {
    localStorage.setItem(FEATURED_STORAGE_KEY, JSON.stringify(featuredCategoryIds));
  }, [featuredCategoryIds]);

  const addCategory = useCallback((name: string, description?: string, icon?: string) => {
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      const current = readCategories();
      if (current.find(cat => cat.id === id || cat.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Category already exists');
      }
      const updated = [...current, { id, name, description, icon }];
      writeCategories(updated);
      setCategories(updated);
      toast({ title: 'Category Added', description: `"${name}" has been added.` });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to Add Category',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<ProductCategory>) => {
    try {
      const current = readCategories();
      const updated = current.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat);
      writeCategories(updated);
      setCategories(updated);
      toast({ title: 'Category Updated', description: 'Category has been updated.' });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to Update Category',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteCategory = useCallback((categoryId: string) => {
    try {
      const current = readCategories();
      const updated = current.filter(cat => cat.id !== categoryId);
      writeCategories(updated);
      setCategories(updated);
      setFeaturedCategoryIds(prev => prev.filter(id => id !== categoryId));
      toast({ title: 'Category Deleted', description: 'Category has been removed.' });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to Delete Category',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const setFeaturedCategories = useCallback((categoryIds: string[]) => {
    setFeaturedCategoryIds(categoryIds);
  }, []);

  const featuredCategories = categories.filter(cat => featuredCategoryIds.includes(cat.id));
  const categoryNames = categories.map(cat => cat.name);

  return {
    categories,
    categoryNames,
    featuredCategories,
    isLoading: false,
    addCategory,
    updateCategory,
    deleteCategory,
    setFeaturedCategories,
  };
}

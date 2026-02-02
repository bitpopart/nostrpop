import { useState, useEffect } from 'react';
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

export function useCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : getDefaultCategories();
    } catch {
      return getDefaultCategories();
    }
  });

  const [featuredCategoryIds, setFeaturedCategoryIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FEATURED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist categories to localStorage
  useEffect(() => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  // Persist featured categories to localStorage
  useEffect(() => {
    localStorage.setItem(FEATURED_STORAGE_KEY, JSON.stringify(featuredCategoryIds));
  }, [featuredCategoryIds]);

  const addCategory = (name: string, description?: string, icon?: string) => {
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      
      // Check if exists
      if (categories.find(cat => cat.id === id || cat.name === name)) {
        throw new Error('Category already exists');
      }

      const newCategory: ProductCategory = { id, name, description, icon };
      setCategories(prev => [...prev, newCategory]);
      
      toast({
        title: "Category Added",
        description: `"${name}" has been added successfully.`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to Add Category",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateCategory = (categoryId: string, updates: Partial<ProductCategory>) => {
    try {
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ));
      
      toast({
        title: "Category Updated",
        description: "Category has been updated successfully.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to Update Category",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCategory = (categoryId: string) => {
    try {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setFeaturedCategoryIds(prev => prev.filter(id => id !== categoryId));
      
      toast({
        title: "Category Deleted",
        description: "Category has been removed successfully.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to Delete Category",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const setFeaturedCategories = (categoryIds: string[]) => {
    setFeaturedCategoryIds(categoryIds);
  };

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

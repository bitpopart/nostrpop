import { useState, useEffect, useCallback } from 'react';
import { 
  ProductCategory, 
  getStoredCategories, 
  saveCategories, 
  getFeaturedCategories,
  generateCategoryId
} from '@/config/categories';
import { useToast } from '@/hooks/useToast';

export function useCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load categories on mount
  useEffect(() => {
    const loadCategories = () => {
      try {
        const stored = getStoredCategories();
        setCategories(stored);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast({
          title: "Error Loading Categories",
          description: "Failed to load categories. Using defaults.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [toast]);

  // Save categories to storage
  const persistCategories = useCallback((newCategories: ProductCategory[]) => {
    try {
      saveCategories(newCategories);
      setCategories(newCategories);
    } catch (error) {
      console.error('Error saving categories:', error);
      toast({
        title: "Error Saving Categories",
        description: "Failed to save category changes.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Add a new category
  const addCategory = useCallback((name: string, description?: string, icon?: string) => {
    const id = generateCategoryId(name);
    
    // Check if category already exists
    if (categories.some(cat => cat.id === id || cat.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Category Exists",
        description: "A category with this name already exists.",
        variant: "destructive"
      });
      return false;
    }

    const newCategory: ProductCategory = {
      id,
      name: name.trim(),
      description: description?.trim(),
      icon: icon?.trim(),
      featured: false,
      createdAt: new Date().toISOString()
    };

    const updatedCategories = [...categories, newCategory];
    persistCategories(updatedCategories);

    toast({
      title: "Category Added",
      description: `"${name}" has been added to the categories.`,
    });

    return true;
  }, [categories, persistCategories, toast]);

  // Update an existing category
  const updateCategory = useCallback((id: string, updates: Partial<ProductCategory>) => {
    const updatedCategories = categories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    persistCategories(updatedCategories);

    toast({
      title: "Category Updated",
      description: "Category has been updated successfully.",
    });
  }, [categories, persistCategories, toast]);

  // Delete a category
  const deleteCategory = useCallback((id: string) => {
    const categoryToDelete = categories.find(cat => cat.id === id);
    if (!categoryToDelete) return;

    const updatedCategories = categories.filter(cat => cat.id !== id);
    persistCategories(updatedCategories);

    toast({
      title: "Category Deleted",
      description: `"${categoryToDelete.name}" has been removed.`,
    });
  }, [categories, persistCategories, toast]);

  // Set featured categories (max 3)
  const setFeaturedCategories = useCallback((featuredIds: string[]) => {
    if (featuredIds.length > 3) {
      toast({
        title: "Too Many Featured Categories",
        description: "You can only feature up to 3 categories.",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = categories.map(cat => ({
      ...cat,
      featured: featuredIds.includes(cat.id)
    }));

    persistCategories(updatedCategories);

    toast({
      title: "Featured Categories Updated",
      description: `${featuredIds.length} categories are now featured.`,
    });
  }, [categories, persistCategories, toast]);

  // Get featured categories
  const featuredCategories = getFeaturedCategories();

  // Get category names for dropdowns
  const categoryNames = categories.map(cat => cat.name);

  return {
    categories,
    featuredCategories,
    categoryNames,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    setFeaturedCategories,
    refreshCategories: () => {
      const stored = getStoredCategories();
      setCategories(stored);
    }
  };
}
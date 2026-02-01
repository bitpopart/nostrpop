import { getCategoryNames, getAllCategories, addCategory as addCategoryHelper, removeCategory as removeCategoryHelper } from '@/config/categories';
import { useToast } from '@/hooks/useToast';

export function useCategories() {
  const { toast } = useToast();

  const handleAddCategory = (name: string, description?: string, icon?: string) => {
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      addCategoryHelper({ id, name, description, icon });
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

  const handleRemoveCategory = (categoryId: string) => {
    try {
      removeCategoryHelper(categoryId);
      toast({
        title: "Category Removed",
        description: "Category has been removed successfully.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Failed to Remove Category",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    categoryNames: getCategoryNames(),
    allCategories: getAllCategories(),
    addCategory: handleAddCategory,
    removeCategory: handleRemoveCategory,
  };
}

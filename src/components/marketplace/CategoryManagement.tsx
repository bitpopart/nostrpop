import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCategories } from '@/hooks/useCategories';
import { ProductCategory } from '@/config/categories';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  StarOff,
  Tag,
  Sparkles,
  Save,
  X
} from 'lucide-react';

export function CategoryManagement() {
  const {
    categories,
    featuredCategories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    setFeaturedCategories
  } = useCategories();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: ''
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const success = addCategory(
      newCategory.name,
      newCategory.description || undefined,
      newCategory.icon || undefined
    );

    if (success) {
      setNewCategory({ name: '', description: '', icon: '' });
      setIsAddingCategory(false);
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    updateCategory(editingCategory.id, {
      name: editingCategory.name,
      description: editingCategory.description,
      icon: editingCategory.icon
    });

    setEditingCategory(null);
  };

  const handleToggleFeatured = (categoryId: string, featured: boolean) => {
    const currentFeatured = featuredCategories.map(cat => cat.id);

    if (featured) {
      if (currentFeatured.length >= 3) {
        return; // Max 3 featured categories
      }
      setFeaturedCategories([...currentFeatured, categoryId]);
    } else {
      setFeaturedCategories(currentFeatured.filter(id => id !== categoryId));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">Loading categories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Tag className="w-6 h-6 mr-2" />
            Category Management
          </h2>
          <p className="text-muted-foreground">
            Manage product categories and set featured categories for the marketplace
          </p>
        </div>
        <Button
          onClick={() => setIsAddingCategory(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Featured Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            Featured Categories
          </CardTitle>
          <CardDescription>
            Select up to 3 categories to feature prominently on the marketplace. Featured categories will be displayed at the top of the shop page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCategories.map((category) => (
              <Card key={category.id} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {category.icon && <span className="text-lg">{category.icon}</span>}
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 3 - featuredCategories.length }).map((_, index) => (
              <Card key={`empty-${index}`} className="border-dashed border-gray-300 dark:border-gray-600">
                <CardContent className="p-4">
                  <div className="text-center text-muted-foreground">
                    <StarOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Available Slot</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Category Form */}
      {isAddingCategory && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Category</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategory({ name: '', description: '', icon: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-category-name">Category Name *</Label>
                <Input
                  id="new-category-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Digital Art"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-icon">Icon (Emoji)</Label>
                <Input
                  id="new-category-icon"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🎨"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-description">Description</Label>
                <Input
                  id="new-category-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description..."
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategory({ name: '', description: '', icon: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
          <CardDescription>
            Manage all product categories. Click the star to feature a category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id}>
                {editingCategory?.id === category.id ? (
                  /* Edit Mode */
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Category Name</Label>
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory(prev =>
                              prev ? { ...prev, name: e.target.value } : null
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Input
                            value={editingCategory.icon || ''}
                            onChange={(e) => setEditingCategory(prev =>
                              prev ? { ...prev, icon: e.target.value } : null
                            )}
                            placeholder="🎨"
                            maxLength={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={editingCategory.description || ''}
                            onChange={(e) => setEditingCategory(prev =>
                              prev ? { ...prev, description: e.target.value } : null
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleUpdateCategory}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCategory(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* View Mode */
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={category.featured}
                          onCheckedChange={(checked) =>
                            handleToggleFeatured(category.id, checked as boolean)
                          }
                          disabled={!category.featured && featuredCategories.length >= 3}
                        />
                        {category.featured ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        {category.icon && (
                          <span className="text-xl">{category.icon}</span>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{category.name}</h3>
                            {category.featured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{category.name}"? This action cannot be undone.
                              Products in this category will need to be recategorized.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCategory(category.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}

                {category.id !== categories[categories.length - 1].id && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
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
import { useShopTags } from '@/hooks/useShopTags';
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
  X,
  Hash,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

export function CategoryManagement() {
  const {
    categories,
    featuredCategories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    setFeaturedCategories,
  } = useCategories();

  const { tags: shopTags, addTag, deleteTag, renameTag, toggleVisibility } = useShopTags();

  // Derive a Set of featured ids for O(1) lookup — avoids relying on category.featured
  // which is never populated by the hook (featured ids are stored separately)
  const featuredIds = new Set(featuredCategories.map(c => c.id));

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: ''
  });

  // Tag management state
  const [tagInput, setTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

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

  const isFeatured = (categoryId: string) => featuredIds.has(categoryId);

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

      {/* ── Tag Library ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-orange-500" />
                Tag Library
              </CardTitle>
              <CardDescription className="mt-1">
                Add keyword tags and control which ones appear as filters in the shop. Tags marked <strong>visible</strong> show in the frontend tag cloud; hidden tags are kept in your library for product labelling but won't clutter the shop.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-green-500" /> Visible in shop</span>
              <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5 text-gray-400" /> Hidden</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Add new tag input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">#</span>
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput('');
                  }
                }}
                placeholder="bitcoin, sneek, amsterdam, logo…"
                className="pl-7"
              />
            </div>
            <Button
              onClick={() => { addTag(tagInput); setTagInput(''); }}
              disabled={!tagInput.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tag
            </Button>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">Press Enter or comma to add quickly. New tags are visible by default.</p>

          {/* Tag rows */}
          {shopTags.length === 0 ? (
            <div className="py-8 border-2 border-dashed rounded-xl text-center text-muted-foreground">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No tags yet</p>
              <p className="text-xs mt-1">Add your first tag above to get started.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Tag</span>
                <span className="text-center w-20">Shop visibility</span>
                <span className="w-7" />
                <span className="w-7" />
              </div>

              {shopTags.map((entry, idx) => (
                <div
                  key={entry.tag}
                  className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 transition-colors
                    ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-muted/20'}
                    ${!entry.visible ? 'opacity-50' : ''}
                  `}
                >
                  {/* Tag name / inline rename */}
                  {editingTag === entry.tag ? (
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 font-bold text-sm">#</span>
                      <input
                        value={editingTagValue}
                        onChange={e => setEditingTagValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { renameTag(entry.tag, editingTagValue); setEditingTag(null); }
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                        className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 rounded px-2 py-0.5 text-sm outline-none text-orange-700 dark:text-orange-300 font-medium w-36"
                        autoFocus
                      />
                      <button type="button" onClick={() => { renameTag(entry.tag, editingTagValue); setEditingTag(null); }} className="text-green-600 hover:text-green-700 ml-1" title="Save">
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditingTag(null)} className="text-muted-foreground hover:text-foreground" title="Cancel">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-sm font-semibold ${entry.visible ? 'text-orange-700 dark:text-orange-300' : 'text-muted-foreground line-through'}`}>
                      #{entry.tag}
                    </span>
                  )}

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => toggleVisibility(entry.tag)}
                    className={`w-20 flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all
                      ${entry.visible
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                      }`}
                    title={entry.visible ? 'Click to hide from shop' : 'Click to show in shop'}
                  >
                    {entry.visible
                      ? <><Eye className="w-3 h-3" /> Visible</>
                      : <><EyeOff className="w-3 h-3" /> Hidden</>
                    }
                  </button>

                  {/* Rename */}
                  <button
                    type="button"
                    onClick={() => { setEditingTag(entry.tag); setEditingTagValue(entry.tag); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={`Rename #${entry.tag}`}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600"
                        title={`Delete #${entry.tag}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete tag #{entry.tag}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes <strong>#{entry.tag}</strong> from your tag library. Existing products that already have this tag won't be changed — you'd need to edit those products individually to remove it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTag(entry.tag)} className="bg-red-500 hover:bg-red-600">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}

          {shopTags.length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              {shopTags.filter(t => t.visible).length} of {shopTags.length} tag{shopTags.length !== 1 ? 's' : ''} visible in the shop frontend.
            </p>
          )}
        </CardContent>
      </Card>

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
                        checked={isFeatured(category.id)}
                        onCheckedChange={(checked) =>
                          handleToggleFeatured(category.id, checked as boolean)
                        }
                        disabled={!isFeatured(category.id) && featuredCategories.length >= 3}
                      />
                      {isFeatured(category.id) ? (
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
                          {isFeatured(category.id) && (
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

                {categories.length > 0 && category.id !== categories[categories.length - 1].id && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
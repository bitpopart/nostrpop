import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { type CardCategory } from '@/hooks/useCardCategories';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Palette,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';



const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name too long'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(200, 'Description too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  icon: z.string().min(1, 'Icon is required').max(10, 'Icon too long'),
  isVisible: z.boolean()
});

type CategoryFormData = z.infer<typeof categorySchema>;

const DEFAULT_CATEGORIES: CardCategory[] = [
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Celebrate special birthdays with joy and happiness',
    color: '#FF6B6B',
    icon: '🎂',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    description: 'Commemorate special milestones and anniversaries',
    color: '#4ECDC4',
    icon: '💕',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'holiday',
    name: 'Holiday',
    description: 'Seasonal greetings and holiday celebrations',
    color: '#45B7D1',
    icon: '🎄',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    description: 'Express gratitude and appreciation',
    color: '#96CEB4',
    icon: '🙏',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'congratulations',
    name: 'Congratulations',
    description: 'Celebrate achievements and successes',
    color: '#FFEAA7',
    icon: '🎉',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'get-well',
    name: 'Get Well',
    description: 'Send healing thoughts and well wishes',
    color: '#DDA0DD',
    icon: '🌸',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'love',
    name: 'Love',
    description: 'Express love and romantic feelings',
    color: '#FF69B4',
    icon: '❤️',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'friendship',
    name: 'Friendship',
    description: 'Celebrate friendship and companionship',
    color: '#87CEEB',
    icon: '👫',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sympathy',
    name: 'Sympathy',
    description: 'Offer comfort and condolences',
    color: '#B0C4DE',
    icon: '🕊️',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional and corporate communications',
    color: '#708090',
    icon: '💼',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function CategoryManagement() {
  const [categories, setCategories] = useLocalStorage<CardCategory[]>('card-categories', DEFAULT_CATEGORIES);
  const [editingCategory, setEditingCategory] = useState<CardCategory | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      color: '#6366F1',
      icon: '📝',
      isVisible: true
    }
  });

  const watchedColor = watch('color');

  const handleCreateCategory = async (data: CategoryFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create categories.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newCategory: CardCategory = {
        id: data.name.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isDefault: false,
        isVisible: data.isVisible,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if category already exists
      if (categories.some(cat => cat.id === newCategory.id)) {
        toast({
          title: "Category Exists",
          description: "A category with this name already exists.",
          variant: "destructive"
        });
        return;
      }

      // Update local storage
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // Publish category to Nostr (using a custom kind for card categories)
      createEvent({
        kind: 30403, // Custom kind for card categories
        content: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
          color: newCategory.color,
          icon: newCategory.icon
        }),
        tags: [
          ['d', newCategory.id],
          ['title', newCategory.name],
          ['t', 'card-category'],
          ['color', newCategory.color],
          ['icon', newCategory.icon]
        ]
      });

      toast({
        title: "Category Created",
        description: `"${newCategory.name}" category has been created successfully.`,
      });

      reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Category creation error:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async (data: CategoryFormData) => {
    if (!user || !editingCategory) {
      toast({
        title: "Authentication Required",
        description: "Please log in to edit categories.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedCategory: CardCategory = {
        ...editingCategory,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isVisible: data.isVisible,
        updated_at: new Date().toISOString()
      };

      // Update local storage
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id ? updatedCategory : cat
      );
      setCategories(updatedCategories);

      // Publish updated category to Nostr
      createEvent({
        kind: 30403,
        content: JSON.stringify({
          name: updatedCategory.name,
          description: updatedCategory.description,
          color: updatedCategory.color,
          icon: updatedCategory.icon
        }),
        tags: [
          ['d', updatedCategory.id],
          ['title', updatedCategory.name],
          ['t', 'card-category'],
          ['color', updatedCategory.color],
          ['icon', updatedCategory.icon]
        ]
      });

      toast({
        title: "Category Updated",
        description: `"${updatedCategory.name}" category has been updated successfully.`,
      });

      reset();
      setEditingCategory(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Category update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    if (category.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default categories cannot be deleted.",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);

    toast({
      title: "Category Deleted",
      description: `"${category.name}" category has been deleted.`,
    });
  };

  const openEditDialog = (category: CardCategory) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('description', category.description);
    setValue('color', category.color);
    setValue('icon', category.icon);
    setValue('isVisible', category.isVisible);
    setIsEditDialogOpen(true);
  };

  const toggleCategoryVisibility = (categoryId: string) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, isVisible: !cat.isVisible, updated_at: new Date().toISOString() } : cat
    );
    setCategories(updatedCategories);

    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      toast({
        title: `Category ${category.isVisible ? 'Hidden' : 'Shown'}`,
        description: `"${category.name}" is now ${category.isVisible ? 'hidden from' : 'visible in'} the cards page filter.`,
      });
    }
  };

  const resetToDefaults = () => {
    setCategories(DEFAULT_CATEGORIES);
    toast({
      title: "Categories Reset",
      description: "All categories have been reset to defaults.",
    });
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to manage card categories.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">
            Manage card categories and their properties
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new card category for users to choose from.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleCreateCategory)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter category name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe this category..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="color"
                        type="color"
                        {...register('color')}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        {...register('color')}
                        placeholder="#6366F1"
                        className="flex-1"
                      />
                    </div>
                    {errors.color && (
                      <p className="text-sm text-red-500">{errors.color.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon *</Label>
                    <Input
                      id="icon"
                      {...register('icon')}
                      placeholder="📝"
                      className="text-center text-lg"
                    />
                    {errors.icon && (
                      <p className="text-sm text-red-500">{errors.icon.message}</p>
                    )}
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVisible"
                      {...register('isVisible')}
                      checked={watch('isVisible')}
                      onCheckedChange={(checked) => setValue('isVisible', checked)}
                    />
                    <Label htmlFor="isVisible" className="flex items-center space-x-2">
                      {watch('isVisible') ? (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Visible in Cards Page</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Hidden from Cards Page</span>
                        </>
                      )}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Controls whether this category appears in the cards page filter. Cards with this category will always be visible.
                  </p>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <span className="text-lg">{watch('icon') || '📝'}</span>
                    <Badge style={{ backgroundColor: watchedColor, color: '#fff' }}>
                      {watch('name') || 'Category Name'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValid || isPublishing}
                  >
                    {isPublishing ? (
                      <>
                        <Save className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Category
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        style={{ backgroundColor: category.color, color: '#fff' }}
                        className="text-xs"
                      >
                        {category.name}
                      </Badge>
                      {category.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                      <Badge
                        variant={category.isVisible ? "default" : "secondary"}
                        className="text-xs flex items-center space-x-1"
                      >
                        {category.isVisible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-4">
                {category.description}
              </CardDescription>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Palette className="w-3 h-3" />
                  <span>{category.color}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Hash className="w-3 h-3" />
                  <span>{category.id}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCategoryVisibility(category.id)}
                  className={category.isVisible ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-600"}
                >
                  {category.isVisible ? (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide
                    </>
                  )}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {!category.isDefault && (
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
                            Are you sure you want to delete the "{category.name}" category?
                            This action cannot be undone and may affect existing cards.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information and properties.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditCategory)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                {...register('name')}
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                {...register('description')}
                placeholder="Describe this category..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="edit-color"
                    type="color"
                    {...register('color')}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    {...register('color')}
                    placeholder="#6366F1"
                    className="flex-1"
                  />
                </div>
                {errors.color && (
                  <p className="text-sm text-red-500">{errors.color.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon *</Label>
                <Input
                  id="edit-icon"
                  {...register('icon')}
                  placeholder="📝"
                  className="text-center text-lg"
                />
                {errors.icon && (
                  <p className="text-sm text-red-500">{errors.icon.message}</p>
                )}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isVisible"
                  {...register('isVisible')}
                  checked={watch('isVisible')}
                  onCheckedChange={(checked) => setValue('isVisible', checked)}
                />
                <Label htmlFor="edit-isVisible" className="flex items-center space-x-2">
                  {watch('isVisible') ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Visible in Cards Page</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Hidden from Cards Page</span>
                    </>
                  )}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Controls whether this category appears in the cards page filter. Cards with this category will always be visible.
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <span className="text-lg">{watch('icon') || '📝'}</span>
                <Badge style={{ backgroundColor: watchedColor, color: '#fff' }}>
                  {watch('name') || 'Category Name'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCategory(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isPublishing}
              >
                {isPublishing ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Category
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
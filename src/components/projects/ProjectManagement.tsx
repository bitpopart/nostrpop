import { useState, useRef, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderKanban,
  Plus,
  Loader2,
  Trash2,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Star,
  Sparkles,
  Gamepad2,
  Clapperboard,
  Globe,
} from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { generateProjectUUID } from '@/lib/projectTypes';

export type ProjectCategory = 'general' | 'games' | 'animations' | 'frl';

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string; icon: typeof Gamepad2; color: string }[] = [
  { value: 'general', label: 'General', icon: FolderKanban, color: 'text-orange-600' },
  { value: 'games', label: 'Games', icon: Gamepad2, color: 'text-violet-600' },
  { value: 'animations', label: 'Animations', icon: Clapperboard, color: 'text-amber-600' },
  { value: 'frl', label: 'POPArt.frl', icon: Globe, color: 'text-pink-600' },
];

interface ProjectFormData {
  name: string;
  description: string;
  thumbnail: string;
  url: string;
  order: string;
  featured: boolean;
  coming_soon: boolean;
  category: ProjectCategory;
}

interface ProjectManagementProps {
  /** Pre-select a category and filter the list to that category only */
  filterCategory?: ProjectCategory;
}

export function ProjectManagement({ filterCategory }: ProjectManagementProps = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<NostrEvent | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    thumbnail: '',
    url: '',
    order: '',
    featured: false,
    coming_soon: false,
    category: filterCategory || 'general',
  });

  // Fetch user's projects (kind 36171)
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-admin', user?.pubkey, filterCategory],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [36171], authors: [user.pubkey], '#t': ['bitpopart-project'], limit: 100 }],
        { signal }
      );
      // Filter by category if filterCategory is set
      const filtered = filterCategory
        ? events.filter(e => {
            const cat = e.tags.find(t => t[0] === 'category')?.[1] || 'general';
            return cat === filterCategory;
          })
        : events;
      return filtered.sort((a, b) => {
        const aOrder = parseInt(a.tags.find(t => t[0] === 'order')?.[1] || '999');
        const bOrder = parseInt(b.tags.find(t => t[0] === 'order')?.[1] || '999');
        return aOrder - bOrder;
      });
    },
    enabled: !!user?.pubkey,
  });

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File is larger than 10MB. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      const imageUrl = tags[0][1]; // Get URL from first tag
      setFormData(prev => ({ ...prev, thumbnail: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const projectId = editingProject?.tags.find(t => t[0] === 'd')?.[1] || generateProjectUUID();

    const tags: string[][] = [
      ['d', projectId],
      ['name', formData.name],
      ['t', 'bitpopart-project'],
      ['category', formData.category],
    ];

    if (formData.thumbnail) {
      tags.push(['image', formData.thumbnail]);
    }
    if (formData.url) {
      tags.push(['r', formData.url]);
    }
    if (formData.order) {
      tags.push(['order', formData.order]);
    }
    if (formData.featured) {
      tags.push(['featured', 'true']);
    }
    if (formData.coming_soon) {
      tags.push(['coming-soon', 'true']);
    }

    const contentData = {
      name: formData.name,
      description: formData.description,
      thumbnail: formData.thumbnail,
      url: formData.url,
    };

    createEvent(
      {
        kind: 36171,
        content: JSON.stringify(contentData),
        tags,
      },
      {
        onSuccess: () => {
          toast.success(editingProject ? 'Project updated!' : 'Project created!');
          setIsCreating(false);
          setEditingProject(null);
          setFormData({
            name: '',
            description: '',
            thumbnail: '',
            url: '',
            order: '',
            featured: false,
            coming_soon: false,
            category: filterCategory || 'general',
          });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
        },
        onError: (error) => {
          console.error('Publish error:', error);
          toast.error('Failed to save project');
        },
      }
    );
  };

  const handleEdit = (event: NostrEvent) => {
    const content = JSON.parse(event.content);
    const nameTag = event.tags.find(t => t[0] === 'name')?.[1];
    const imageTag = event.tags.find(t => t[0] === 'image')?.[1];
    const urlTag = event.tags.find(t => t[0] === 'r')?.[1];
    const orderTag = event.tags.find(t => t[0] === 'order')?.[1];
    const featuredTag = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';
    const comingSoonTag = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';
    const categoryTag = (event.tags.find(t => t[0] === 'category')?.[1] || 'general') as ProjectCategory;

    setFormData({
      name: nameTag || content.name || '',
      description: content.description || '',
      thumbnail: imageTag || content.thumbnail || '',
      url: urlTag || content.url || '',
      order: orderTag || '',
      featured: featuredTag,
      coming_soon: comingSoonTag,
      category: categoryTag,
    });
    setEditingProject(event);
    setIsCreating(true);
  };

  const handleDelete = (event: NostrEvent) => {
    const projectId = event.tags.find(t => t[0] === 'd')?.[1];
    if (!projectId) return;

    if (confirm('Are you sure you want to delete this project?')) {
      createEvent(
        {
          kind: 5,
          content: 'Deleted project',
          tags: [['a', `36171:${event.pubkey}:${projectId}`]],
        },
        {
          onSuccess: () => {
            toast.success('Project deleted');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      thumbnail: '',
      url: '',
      order: '',
      featured: false,
      coming_soon: false,
      category: filterCategory || 'general',
    });
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Add a new project to showcase on the Projects page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="My Amazing Project"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Project Thumbnail</Label>
                
                {formData.thumbnail ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <img
                        src={formData.thumbnail}
                        alt="Project thumbnail"
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      type="url"
                      placeholder="Or paste image URL"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Thumbnail
                        </>
                      )}
                    </Button>
                    <Input
                      type="url"
                      placeholder="Or paste image URL"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Project URL (optional)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com or /internal-page"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  External URLs will open in a new tab. Internal paths (e.g., /cards) will navigate within the app.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ProjectCategory }))}
                  disabled={!!filterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <cat.icon className={`h-4 w-4 ${cat.color}`} />
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose which section this project belongs to
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order (optional)</Label>
                <Input
                  id="order"
                  type="number"
                  placeholder="1, 2, 3... (lower numbers appear first)"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', e.target.value)}
                />
              </div>

              <div className="space-y-2 p-4 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                  />
                  <Label htmlFor="featured" className="text-base font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    Feature on Homepage
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Display this project in the featured section on the homepage (limit: 3 projects)
                </p>
              </div>

              <div className="space-y-2 p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coming_soon"
                    checked={formData.coming_soon}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, coming_soon: !!checked }))}
                  />
                  <Label htmlFor="coming_soon" className="text-base font-medium">
                    Coming Soon
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mark this project as "Coming Soon" - it will be displayed with a special badge
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingProject ? 'Update Project' : 'Create Project'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-6">
          <Button onClick={() => setIsCreating(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            {filterCategory
              ? `Add New ${PROJECT_CATEGORIES.find(c => c.value === filterCategory)?.label || ''} Project`
              : 'Add New Project'}
          </Button>
        </div>
      )}

      <Separator />

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderKanban className="h-5 w-5 mr-2" />
            Your Projects
          </CardTitle>
          <CardDescription>
            Manage your project portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No custom projects yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((event) => {
                const content = JSON.parse(event.content);
                const name = event.tags.find(t => t[0] === 'name')?.[1] || content.name || 'Untitled';
                const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail;
                const url = event.tags.find(t => t[0] === 'r')?.[1] || content.url;
                const order = event.tags.find(t => t[0] === 'order')?.[1];
                const featured = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';
                const comingSoon = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';
                const category = (event.tags.find(t => t[0] === 'category')?.[1] || 'general') as ProjectCategory;
                const categoryInfo = PROJECT_CATEGORIES.find(c => c.value === category);

                return (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="flex gap-4">
                      {thumbnail ? (
                        <div className="w-32 h-24 flex-shrink-0">
                          <img
                            src={thumbnail}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-purple-200 via-pink-200 to-indigo-200 dark:from-purple-800 dark:via-pink-800 dark:to-indigo-800 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-50" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{name}</h3>
                              {featured && (
                                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {comingSoon && (
                                <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-pink-700 text-xs">
                                  Coming Soon
                                </Badge>
                              )}
                              {categoryInfo && category !== 'general' && (
                                <Badge variant="outline" className={`text-xs ${categoryInfo.color}`}>
                                  <categoryInfo.icon className="h-3 w-3 mr-1" />
                                  {categoryInfo.label}
                                </Badge>
                              )}
                              {order && (
                                <Badge variant="outline" className="text-xs">
                                  Order: {order}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {content.description}
                            </p>
                            {url && (
                              <a
                                href={url}
                                target={url.startsWith('http') ? '_blank' : undefined}
                                rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {url}
                                {url.startsWith('http') && <ExternalLink className="h-3 w-3" />}
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(event)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Built-in Projects Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Built-in Projects
          </CardTitle>
          <CardDescription>
            Customize thumbnails for core projects (21K Art, Canvas, POP Cards)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BuiltInProjectsManager />
        </CardContent>
      </Card>
    </div>
  );
}

// Built-in Projects Manager Component
function BuiltInProjectsManager() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const queryClient = useQueryClient();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Fetch built-in project thumbnails
  const { data: builtInProjects } = useQuery({
    queryKey: ['builtin-projects', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [36171], authors: [user.pubkey], '#t': ['builtin-project'], limit: 10 }],
        { signal }
      );

      return events;
    },
    enabled: !!user?.pubkey,
  });

  // Load thumbnails from events
  useEffect(() => {
    if (builtInProjects) {
      const newThumbnails: Record<string, string> = {};
      builtInProjects.forEach(event => {
        const projectId = event.tags.find(t => t[0] === 'd')?.[1];
        const thumbnail = event.tags.find(t => t[0] === 'image')?.[1];
        if (projectId && thumbnail) {
          newThumbnails[projectId] = thumbnail;
        }
      });
      setThumbnails(newThumbnails);
    }
  }, [builtInProjects]);

  const handleImageUpload = async (projectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File is larger than 10MB. Please choose a smaller file.');
      return;
    }

    setIsUploading(projectId);
    try {
      const tags = await uploadFile(file);
      const imageUrl = tags[0][1];
      
      // Save to Nostr
      createEvent(
        {
          kind: 36171,
          content: JSON.stringify({ thumbnail: imageUrl }),
          tags: [
            ['d', projectId],
            ['image', imageUrl],
            ['t', 'builtin-project'],
          ],
        },
        {
          onSuccess: () => {
            setThumbnails(prev => ({ ...prev, [projectId]: imageUrl }));
            toast.success('Thumbnail updated!');
            queryClient.invalidateQueries({ queryKey: ['builtin-projects'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          },
          onError: () => {
            toast.error('Failed to update thumbnail');
          },
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(null);
    }
  };

  const handleRemoveImage = (projectId: string) => {
    createEvent(
      {
        kind: 36171,
        content: JSON.stringify({ thumbnail: '' }),
        tags: [
          ['d', projectId],
          ['t', 'builtin-project'],
        ],
      },
      {
        onSuccess: () => {
          setThumbnails(prev => ({ ...prev, [projectId]: '' }));
          toast.success('Thumbnail removed!');
          queryClient.invalidateQueries({ queryKey: ['builtin-projects'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
      }
    );
  };

  const projects = [
    { id: '21k-art', name: '21K Art', description: 'Exclusive artwork collection priced at 21,000 sats', type: 'built-in' as const },
    { id: '100m-canvas', name: '100M Canvas', description: 'Collaborative pixel art project', type: 'built-in' as const },
    { id: 'cards', name: 'POP Cards', description: 'Create and share Good Vibes cards', type: 'built-in' as const },
    { id: 'category-games', name: 'Games Section', description: 'Thumbnail for the Games category on the Projects page', type: 'category' as const },
    { id: 'category-animations', name: 'Animations Section', description: 'Thumbnail for the Animations category on the Projects page', type: 'category' as const },
    { id: 'category-frl', name: 'POPArt.frl Section', description: 'Thumbnail for the POPArt.frl category on the Projects page', type: 'category' as const },
  ];

  const builtInItems = projects.filter(p => p.type === 'built-in');
  const categoryItems = projects.filter(p => p.type === 'category');

  return (
    <div className="space-y-6">
      {/* Built-in Projects */}
      <div className="space-y-4">
        {builtInItems.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <div className="flex gap-4">
              {thumbnails[project.id] ? (
                <div className="w-32 h-24 flex-shrink-0 relative group">
                  <img
                    src={thumbnails[project.id]}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(project.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-purple-200 via-pink-200 to-indigo-200 dark:from-purple-800 dark:via-pink-800 dark:to-indigo-800 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white opacity-50" />
                </div>
              )}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Built-in Project
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={(el) => { fileInputRefs.current[project.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(project.id, e)}
                      disabled={isUploading === project.id}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRefs.current[project.id]?.click()}
                      disabled={isUploading === project.id}
                    >
                      {isUploading === project.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {thumbnails[project.id] ? 'Change' : 'Add'} Thumbnail
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Category Section Thumbnails */}
      <Separator />
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FolderKanban className="h-5 w-5" />
          Category Section Thumbnails
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload thumbnails for the 3 main category sections shown at the top of the Projects page
        </p>
        <div className="space-y-4">
          {categoryItems.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div className="flex gap-4">
                {thumbnails[project.id] ? (
                  <div className="w-32 h-24 flex-shrink-0 relative group">
                    <img
                      src={thumbnails[project.id]}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(project.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-orange-200 via-pink-200 to-rose-200 dark:from-orange-800 dark:via-pink-800 dark:to-rose-800 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-white opacity-50" />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.description}
                      </p>
                      <Badge variant="outline" className="text-xs text-orange-600">
                        <Globe className="h-3 w-3 mr-1" />
                        Category Thumbnail
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={(el) => { fileInputRefs.current[project.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(project.id, e)}
                        disabled={isUploading === project.id}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[project.id]?.click()}
                        disabled={isUploading === project.id}
                      >
                        {isUploading === project.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {thumbnails[project.id] ? 'Change' : 'Add'} Thumbnail
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

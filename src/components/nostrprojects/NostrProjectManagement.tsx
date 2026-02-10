import { useState } from 'react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrProjects } from '@/hooks/useNostrProjects';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { BadgeManagement } from '@/components/badges/BadgeManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Upload, Image as ImageIcon, Edit, Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateNostrProjectUUID } from '@/lib/nostrProjectTypes';
import type { NostrProjectData } from '@/lib/nostrProjectTypes';

export function NostrProjectManagement() {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { data: projects, isLoading } = useNostrProjects();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<NostrProjectData | null>(null);
  
  // Form state
  const [headerImage, setHeaderImage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [priceSats, setPriceSats] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [featured, setFeatured] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  
  const resetForm = () => {
    setHeaderImage('');
    setTitle('');
    setDescription('');
    setImages([]);
    setPriceSats('');
    setAuthorHandle('');
    setStatus('active');
    setFeatured(false);
    setComingSoon(false);
    setEditingProject(null);
    setIsCreating(false);
  };

  const handleEdit = (project: NostrProjectData) => {
    setEditingProject(project);
    setHeaderImage(project.header_image || '');
    setTitle(project.title);
    setDescription(project.description);
    setImages(project.images);
    setPriceSats(project.price_sats.toString());
    setAuthorHandle(project.author_handle || '');
    setStatus(project.status);
    setFeatured(project.featured || false);
    setComingSoon(project.coming_soon || false);
    setIsCreating(true);
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tags = await uploadFile(file);
      const imageUrl = tags[0][1]; // First tag contains the URL
      setHeaderImage(imageUrl);
    } catch (error) {
      console.error('Failed to upload header image:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const tags = await uploadFile(file);
        const imageUrl = tags[0][1]; // First tag contains the URL
        setImages(prev => [...prev, imageUrl]);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // For coming soon projects, images are optional. For active projects, require at least one image.
    const requiresImages = !comingSoon;
    if (!user || !title.trim() || (requiresImages && images.length === 0) || !priceSats) return;

    const projectId = editingProject?.id || generateNostrProjectUUID();

    createEvent(
      {
        kind: 38171,
        content: JSON.stringify({
          description: description.trim(),
          images: images,
        }),
        tags: [
          ['d', projectId],
          ['title', title.trim()],
          ['price', priceSats],
          ['status', status],
          ['t', 'nostr-project'],
          ...(headerImage ? [['header-image', headerImage]] : []),
          ...(featured ? [['featured', 'true']] : []),
          ...(comingSoon ? [['coming-soon', 'true']] : []),
          ...(authorHandle ? [['author-handle', authorHandle.trim()]] : []),
          ...images.map((img, i) => ['image', img, i.toString()]),
        ],
      },
      {
        onSuccess: () => {
          toast.success(editingProject ? 'Nostr project updated!' : 'Nostr project created!');
          queryClient.invalidateQueries({ queryKey: ['nostr-projects'] });
          queryClient.invalidateQueries({ queryKey: ['featured-nostr-projects'] });
          resetForm();
        },
        onError: (error) => {
          console.error('Failed to create Nostr project:', error);
          toast.error('Failed to save Nostr project. Please try again.');
        },
      }
    );
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to manage Nostr projects</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="nostr-projects" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
        <TabsTrigger value="nostr-projects">Nostr Projects</TabsTrigger>
        <TabsTrigger value="badges">Badges</TabsTrigger>
      </TabsList>

      <TabsContent value="nostr-projects" className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Nostr Project Management</CardTitle>
                <CardDescription>Create collaborative art projects where people can join by selecting images</CardDescription>
              </div>
              <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
                {isCreating ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProject ? 'Edit' : 'Create New'} Nostr Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Image */}
            <div className="space-y-2">
              <Label htmlFor="header-image">Header Image / Thumbnail</Label>
              
              {headerImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img
                      src={headerImage}
                      alt="Header image"
                      className="w-full h-64 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setHeaderImage('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    type="url"
                    placeholder="Or paste image URL"
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    id="header-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeaderImageUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('header-image-upload')?.click()}
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
                        Upload Header Image
                      </>
                    )}
                  </Button>
                  <Input
                    type="url"
                    placeholder="Or paste image URL"
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                This image will be used as the project thumbnail on the projects page
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your collaborative art project"
                rows={4}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Artwork Images {comingSoon ? '(optional for coming soon)' : '* (People will choose one)'}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Artwork ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <label className="w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <div className="text-center">
                    {isUploading ? (
                      <div className="animate-spin">⏳</div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-500">Upload Image</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                {comingSoon 
                  ? 'Upload images for preview (optional). Participants will select one when the project launches.'
                  : 'Upload multiple images. Participants will select one to join the project.'
                }
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price in Sats *</Label>
              <Input
                id="price"
                type="number"
                value={priceSats}
                onChange={(e) => setPriceSats(e.target.value)}
                placeholder="21000"
                min="0"
              />
            </div>

            {/* Author Handle */}
            <div className="space-y-2">
              <Label htmlFor="handle">Your Nostr Handle (optional)</Label>
              <Input
                id="handle"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                placeholder="@bitpopart"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'completed' | 'archived')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured */}
            <div className="space-y-2 p-4 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => setFeatured(checked as boolean)}
                />
                <Label
                  htmlFor="featured"
                  className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Feature on homepage and projects page
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Display this project in the featured section on the homepage
              </p>
            </div>

            {/* Coming Soon */}
            <div className="space-y-2 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coming_soon"
                  checked={comingSoon}
                  onCheckedChange={(checked) => setComingSoon(checked as boolean)}
                />
                <Label
                  htmlFor="coming_soon"
                  className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Coming Soon
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Mark this project as "Coming Soon" - it will be displayed with a special badge
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || (!comingSoon && images.length === 0) || !priceSats}
              >
                {editingProject ? 'Update' : 'Create'} Project
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Nostr Projects</CardTitle>
          <CardDescription>All collaborative art projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-32 h-20 flex-shrink-0">
                    {project.header_image ? (
                      <img
                        src={project.header_image}
                        alt={project.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : project.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 h-full">
                        {project.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 rounded flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-purple-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{project.title}</h3>
                      {project.coming_soon && (
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {project.price_sats.toLocaleString()} sats
                      </Badge>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      <Badge variant="outline">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {project.images.length} images
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No Nostr projects yet. Create your first collaborative art project!
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="badges">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-6 w-6 mr-2" />
              Badge Management
            </CardTitle>
            <CardDescription>
              Create purchasable badges that users can add to their Nostr profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BadgeManagement />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

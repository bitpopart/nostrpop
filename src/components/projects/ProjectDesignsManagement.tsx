import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useProjectDesigns } from '@/hooks/useProjectDesigns';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { Palette, Plus, Trash2, Upload, Link, Image as ImageIcon, GripVertical } from 'lucide-react';
import { generateProjectUUID } from '@/lib/projectTypes';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

function DesignThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.startsWith(CORS_PROXY) && /^https?:\/\//i.test(img.src)) {
          img.src = `${CORS_PROXY}${encodeURIComponent(img.src)}`;
        }
      }}
    />
  );
}

interface DesignFormState {
  title: string;
  thumbnailUrl: string;
  projectUrl: string;
  order: string;
}

const EMPTY_FORM: DesignFormState = {
  title: '',
  thumbnailUrl: '',
  projectUrl: '',
  order: '',
};

export function ProjectDesignsManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { data: designs = [], isLoading } = useProjectDesigns();

  const [form, setForm] = useState<DesignFormState>(EMPTY_FORM);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const adminPubkey = getAdminPubkeyHex();

  const handleImageUpload = async (file: File) => {
    try {
      const [[_, url]] = await uploadFile(file);
      setForm(prev => ({ ...prev, thumbnailUrl: url }));
      toast({ title: 'Image uploaded', description: 'Thumbnail uploaded successfully.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
    }
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handlePublish = async () => {
    if (!user) {
      toast({ title: 'Login required', description: 'Please log in as admin to publish.', variant: 'destructive' });
      return;
    }
    if (!form.thumbnailUrl) {
      toast({ title: 'Thumbnail required', description: 'Please upload or enter a thumbnail URL.', variant: 'destructive' });
      return;
    }

    setIsPublishing(true);
    try {
      const id = generateProjectUUID();
      const tags: string[][] = [
        ['d', id],
        ['t', 'project-design'],
        ['image', form.thumbnailUrl],
        ['alt', `Project Design${form.title ? ': ' + form.title : ''}`],
      ];

      if (form.title.trim()) tags.push(['title', form.title.trim()]);
      if (form.projectUrl.trim()) tags.push(['r', form.projectUrl.trim()]);
      if (form.order.trim()) tags.push(['order', form.order.trim()]);

      await nostr.event({
        kind: 38178,
        content: '',
        tags,
      }, { signal: AbortSignal.timeout(8000) });

      toast({ title: 'Design published!', description: 'Thumbnail added to Project Designs section.' });
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ['project-designs', adminPubkey] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Publish failed', description: message, variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (designId: string) => {
    if (!user) return;
    setDeletingId(designId);
    try {
      // Publish a deletion event (kind 5) to remove this addressable event
      await nostr.event({
        kind: 5,
        content: 'deleted',
        tags: [
          ['a', `38178:${user.pubkey}:${designId}`],
          ['alt', 'Delete project design thumbnail'],
        ],
      }, { signal: AbortSignal.timeout(8000) });

      toast({ title: 'Deleted', description: 'Design thumbnail removed.' });
      await queryClient.invalidateQueries({ queryKey: ['project-designs', adminPubkey] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette className="h-6 w-6 text-pink-500" />
        <div>
          <h2 className="text-2xl font-bold">Project Designs</h2>
          <p className="text-muted-foreground text-sm">
            Upload thumbnail images linked to project pages. They appear on <code>/projects</code> between "Nostr Projects" and "Nostr Badges".
          </p>
        </div>
      </div>

      {/* Add New Design Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Add Design Thumbnail
          </CardTitle>
          <CardDescription>Upload a photo/thumbnail and link it to a project page URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail Image *</Label>
            <div className="flex gap-2 items-start">
              {/* Upload button */}
              <label className="flex-1">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-pink-400 transition-colors">
                  {form.thumbnailUrl ? (
                    <div className="relative aspect-square max-w-[120px] mx-auto overflow-hidden rounded-lg">
                      <DesignThumb src={form.thumbnailUrl} alt="preview" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-5 w-5 border-2 border-pink-500 border-t-transparent rounded-full" />
                          <span className="text-sm">Uploading…</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8" />
                          <span className="text-sm">Click to upload image</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleFileDrop}
                  />
                </div>
              </label>

              {/* OR paste URL */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <ImageIcon className="h-3 w-3" /> or paste URL directly
                </div>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={form.thumbnailUrl}
                  onChange={e => setForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="design-title">Title (optional)</Label>
            <Input
              id="design-title"
              placeholder="e.g. Bitcoin Pop Art Series"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Project URL */}
          <div className="space-y-1">
            <Label htmlFor="design-url" className="flex items-center gap-1">
              <Link className="h-3 w-3" /> Project Page URL
            </Label>
            <Input
              id="design-url"
              placeholder="e.g. /art or https://bitpopart.com/projects/xyz"
              value={form.projectUrl}
              onChange={e => setForm(prev => ({ ...prev, projectUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Use a relative path (e.g. <code>/art</code>) for internal pages, or a full URL for external links.
            </p>
          </div>

          {/* Display Order */}
          <div className="space-y-1">
            <Label htmlFor="design-order" className="flex items-center gap-1">
              <GripVertical className="h-3 w-3" /> Display Order (optional)
            </Label>
            <Input
              id="design-order"
              type="number"
              placeholder="1, 2, 3 …"
              value={form.order}
              onChange={e => setForm(prev => ({ ...prev, order: e.target.value }))}
              className="max-w-[120px]"
            />
          </div>

          <Button
            onClick={handlePublish}
            disabled={isPublishing || isUploading || !form.thumbnailUrl}
            className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-600 hover:via-fuchsia-600 hover:to-violet-700 text-white border-0"
          >
            {isPublishing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Publishing…
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add to Project Designs
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Designs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Designs</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading…' : `${designs.length} design thumbnail${designs.length !== 1 ? 's' : ''} published`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No design thumbnails yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {designs.map((design) => (
                <div key={design.id} className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-pink-400 transition-all">
                  {/* Thumbnail */}
                  <div className="aspect-square overflow-hidden bg-muted">
                    <DesignThumb src={design.thumbnail} alt={design.title || 'design'} />
                  </div>

                  {/* Info overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-end">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        disabled={deletingId === design.id}
                        onClick={() => handleDelete(design.id)}
                      >
                        {deletingId === design.id ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {design.title && (
                        <p className="text-white text-xs font-medium truncate">{design.title}</p>
                      )}
                      {design.projectUrl && (
                        <Badge variant="secondary" className="text-[10px] truncate max-w-full">
                          {design.projectUrl}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Order badge */}
                  {design.order < 999 && (
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold rounded px-1">
                      #{design.order}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

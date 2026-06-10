import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useProjectDesigns, type ProjectDesign } from '@/hooks/useProjectDesigns';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  Palette, Plus, Trash2, Upload, Link, Image as ImageIcon,
  GripVertical, Pencil, X, Save, AlertTriangle,
} from 'lucide-react';
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
  id: string | null; // null = new, string = editing existing
  title: string;
  thumbnailUrl: string;
  projectUrl: string;
  order: string;
}

const EMPTY_FORM: DesignFormState = {
  id: null,
  title: '',
  thumbnailUrl: '',
  projectUrl: '',
  order: '',
};

function designToForm(d: ProjectDesign): DesignFormState {
  return {
    id: d.id,
    title: d.title,
    thumbnailUrl: d.thumbnail,
    projectUrl: d.projectUrl,
    order: d.order < 999 ? String(d.order) : '',
  };
}

// ─── Shared form UI ──────────────────────────────────────────────────────────

interface DesignFormProps {
  form: DesignFormState;
  isUploading: boolean;
  isSubmitting: boolean;
  onChange: (patch: Partial<DesignFormState>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

function DesignForm({ form, isUploading, isSubmitting, onChange, onFileChange, onSubmit, onCancel }: DesignFormProps) {
  const isEditing = form.id !== null;

  return (
    <div className="space-y-4">
      {/* Thumbnail */}
      <div className="space-y-2">
        <Label>Thumbnail Image *</Label>
        <div className="flex gap-3 items-start">
          {/* Upload area */}
          <label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-pink-400 transition-colors">
              {form.thumbnailUrl ? (
                <div className="relative aspect-square max-w-[110px] mx-auto overflow-hidden rounded-lg">
                  <DesignThumb src={form.thumbnailUrl} alt="preview" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-pink-500 border-t-transparent rounded-full" />
                      <span className="text-sm">Uploading…</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-7 w-7" />
                      <span className="text-xs">Click to upload</span>
                    </>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={onFileChange} />
            </div>
            {form.thumbnailUrl && (
              <p className="text-xs text-center text-muted-foreground mt-1">Click to replace</p>
            )}
          </label>

          {/* URL paste */}
          <div className="flex-1 space-y-1 pt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" /> or paste URL
            </div>
            <Input
              placeholder="https://…/image.jpg"
              value={form.thumbnailUrl}
              onChange={e => onChange({ thumbnailUrl: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="df-title">Title (optional)</Label>
        <Input
          id="df-title"
          placeholder="e.g. Bitcoin Pop Art Series"
          value={form.title}
          onChange={e => onChange({ title: e.target.value })}
        />
      </div>

      {/* URL */}
      <div className="space-y-1">
        <Label htmlFor="df-url" className="flex items-center gap-1">
          <Link className="h-3 w-3" /> Project Page URL
        </Label>
        <Input
          id="df-url"
          placeholder="/art  or  https://…"
          value={form.projectUrl}
          onChange={e => onChange({ projectUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Relative path for internal pages, full URL for external links.
        </p>
      </div>

      {/* Order */}
      <div className="space-y-1">
        <Label htmlFor="df-order" className="flex items-center gap-1">
          <GripVertical className="h-3 w-3" /> Display Order (optional)
        </Label>
        <Input
          id="df-order"
          type="number"
          placeholder="1, 2, 3 …"
          value={form.order}
          onChange={e => onChange({ order: e.target.value })}
          className="max-w-[120px]"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || isUploading || !form.thumbnailUrl}
          className="flex-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-600 hover:via-fuchsia-600 hover:to-violet-700 text-white border-0"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEditing ? 'Save Changes' : 'Add Design'}
            </span>
          )}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectDesignsManagement() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { data: designs = [], isLoading } = useProjectDesigns();

  const [form, setForm] = useState<DesignFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const adminPubkey = getAdminPubkeyHex();
  const isEditing = form.id !== null;

  const patchForm = (patch: Partial<DesignFormState>) => setForm(prev => ({ ...prev, ...patch }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const [[_, url]] = await uploadFile(file);
      patchForm({ thumbnailUrl: url });
      toast({ title: 'Image uploaded', description: 'Thumbnail uploaded successfully.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Login required', variant: 'destructive' });
      return;
    }
    if (!form.thumbnailUrl) {
      toast({ title: 'Thumbnail required', description: 'Please upload or enter a thumbnail URL.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-use existing id when editing (same d-tag = replaces the old event on relays)
      const id = form.id ?? generateProjectUUID();

      const tags: string[][] = [
        ['d', id],
        ['t', 'project-design'],
        ['image', form.thumbnailUrl],
        ['alt', `Project Design${form.title ? ': ' + form.title : ''}`],
      ];
      if (form.title.trim())      tags.push(['title', form.title.trim()]);
      if (form.projectUrl.trim()) tags.push(['r', form.projectUrl.trim()]);
      if (form.order.trim())      tags.push(['order', form.order.trim()]);

      await publishEvent({ kind: 38178, content: '', tags });

      toast({
        title: isEditing ? 'Design updated!' : 'Design published!',
        description: isEditing ? 'Changes saved successfully.' : 'Thumbnail added to Project Designs.',
      });
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ['project-designs', adminPubkey] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: isEditing ? 'Update failed' : 'Publish failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (design: ProjectDesign) => {
    setForm(designToForm(design));
    // Scroll the form into view smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => setForm(EMPTY_FORM);

  const handleDelete = async (designId: string) => {
    if (!user) return;
    setDeletingId(designId);
    setConfirmDeleteId(null);
    try {
      await publishEvent({
        kind: 5,
        content: 'deleted',
        tags: [
          ['a', `38178:${user.pubkey}:${designId}`],
          ['alt', 'Delete project design thumbnail'],
        ],
      });
      // If we were editing this item, reset the form
      if (form.id === designId) setForm(EMPTY_FORM);
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

      {/* Add / Edit form */}
      <Card className={isEditing ? 'border-fuchsia-400 dark:border-fuchsia-600 shadow-md' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isEditing ? (
              <>
                <Pencil className="h-5 w-5 text-fuchsia-500" />
                Edit Design
                <Badge variant="outline" className="ml-auto text-fuchsia-600 border-fuchsia-400 text-xs">
                  Editing
                </Badge>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Design Thumbnail
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update the thumbnail image, title, link, or order — then click Save Changes.'
              : 'Upload a photo/thumbnail and optionally link it to a project page URL.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DesignForm
            form={form}
            isUploading={isUploading}
            isSubmitting={isSubmitting}
            onChange={patchForm}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            onCancel={isEditing ? handleCancelEdit : undefined}
          />
        </CardContent>
      </Card>

      {/* Existing designs list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Designs</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading…'
              : `${designs.length} design thumbnail${designs.length !== 1 ? 's' : ''} — click ✏️ to edit, 🗑️ to delete`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No design thumbnails yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {designs.map((design) => {
                const isActiveEdit = form.id === design.id;
                const isDeleting = deletingId === design.id;
                const isConfirming = confirmDeleteId === design.id;

                return (
                  <div
                    key={design.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActiveEdit
                        ? 'border-fuchsia-400 dark:border-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-gray-200 dark:border-gray-700">
                      <DesignThumb src={design.thumbnail} alt={design.title || 'design'} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-medium text-sm truncate">
                        {design.title || <span className="text-muted-foreground italic">No title</span>}
                      </p>
                      {design.projectUrl && (
                        <p className="text-xs text-muted-foreground truncate">
                          🔗 {design.projectUrl}
                        </p>
                      )}
                      {design.order < 999 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Order #{design.order}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isConfirming ? (
                        /* Confirm delete row */
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600 flex items-center gap-1 mr-1">
                            <AlertTriangle className="h-3 w-3" /> Delete?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            disabled={isDeleting}
                            onClick={() => handleDelete(design.id)}
                          >
                            {isDeleting ? (
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            ) : 'Yes'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Edit button */}
                          <Button
                            size="icon"
                            variant={isActiveEdit ? 'default' : 'ghost'}
                            className={`h-8 w-8 ${isActiveEdit ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white' : 'text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20'}`}
                            title="Edit"
                            onClick={() => isActiveEdit ? handleCancelEdit() : handleEdit(design)}
                          >
                            {isActiveEdit ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                          </Button>

                          {/* Delete button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(design.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacer so scroll-to-top on edit has room */}
      {designs.length > 0 && <div className="h-4" />}
    </div>
  );
}

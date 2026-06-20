import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardTemplates, useCreateCardTemplate, useDeleteCardTemplate } from '@/hooks/useCardTemplates';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, ImageIcon, Upload, Loader2, LayoutTemplate } from 'lucide-react';

export function CardTemplatesAdmin() {
  const { data: templates, isLoading } = useCardTemplates();
  const { mutate: createTemplate, isPending: isCreating } = useCreateCardTemplate();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteCardTemplate();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const [[, url]] = await uploadFile(file);
      setUploadedUrl(url);
      toast({ title: 'Image uploaded ✅', description: 'Image ready to use as template.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive' });
      setPreviewUrl(null);
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    if (!uploadedUrl) {
      toast({ title: 'Image required', description: 'Please upload an image for the template.', variant: 'destructive' });
      return;
    }

    const id = `template-${Date.now()}`;
    createTemplate(
      { id, name: form.name.trim(), description: form.description.trim() || undefined, coverImage: uploadedUrl, category: form.category.trim() || undefined },
      {
        onSuccess: () => {
          toast({ title: 'Template added! 🎨', description: `"${form.name}" is now available in the card editor.` });
          setForm({ name: '', description: '', category: '' });
          setPreviewUrl(null);
          setUploadedUrl(null);
          setShowForm(false);
        },
        onError: () => {
          toast({ title: 'Failed to save template', variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteTemplate(id, {
      onSuccess: () => toast({ title: `Template "${name}" deleted.` }),
      onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-pink-600" />
            Card Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload background images that users can pick when creating their own cards.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Add Template Form */}
      {showForm && (
        <Card className="border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="text-lg">New Card Template</CardTitle>
            <CardDescription>Upload a background image + give it a name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Template Image *</Label>
              <div className="flex items-start gap-4">
                <label className="cursor-pointer flex-shrink-0">
                  <div className="w-32 h-48 border-2 border-dashed border-pink-300 rounded-lg overflow-hidden flex items-center justify-center bg-pink-50 dark:bg-pink-900/10 hover:bg-pink-100 dark:hover:bg-pink-900/20 transition-colors">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="h-8 w-8 text-pink-400 mx-auto mb-1" />
                        <p className="text-xs text-pink-500">Click to upload</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
                <div className="flex-1 space-y-3">
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-pink-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading image…
                    </div>
                  )}
                  {uploadedUrl && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Upload className="h-4 w-4" />
                      Image uploaded ✅
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="tpl-name">Template Name *</Label>
                    <Input
                      id="tpl-name"
                      placeholder="e.g. Tropical Vibes"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tpl-cat">Category (optional)</Label>
                    <Input
                      id="tpl-cat"
                      placeholder="e.g. Birthday, Holiday…"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tpl-desc">Description (optional)</Label>
                    <Textarea
                      id="tpl-desc"
                      placeholder="Brief description of this template…"
                      rows={2}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreate}
                disabled={isCreating || isUploading || !uploadedUrl || !form.name.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Plus className="h-4 w-4 mr-2" />Save Template</>}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setPreviewUrl(null); setUploadedUrl(null); setForm({ name: '', description: '', category: '' }); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full aspect-[3/4] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first card template background image above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="group relative rounded-lg overflow-hidden border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={tpl.coverImage}
                  alt={tpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Delete button overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{tpl.name}" will be removed from the card editor. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(tpl.id, tpl.name)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Info */}
              <div className="p-2 space-y-1">
                <p className="font-medium text-sm line-clamp-1">{tpl.name}</p>
                {tpl.category && (
                  <Badge variant="secondary" className="text-xs">{tpl.category}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

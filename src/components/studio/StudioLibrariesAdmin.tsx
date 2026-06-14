import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useStudioLibraries, useCreateStudioLibrary, useDeleteStudioLibrary } from '@/hooks/useStudioLibraries';
import type { StudioLibrary, StudioImage } from '@/lib/studioTypes';
import {
  Plus,
  Trash2,
  Upload,
  ImagePlus,
  Pencil,
  FolderOpen,
  X,
  Library,
  ImageIcon,
  Loader2,
} from 'lucide-react';

// Generate a simple slug ID from a name
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 64);
}

// ─── Library Form ─────────────────────────────────────────────────────────────

interface LibraryFormProps {
  existing?: StudioLibrary;
  onClose: () => void;
}

function LibraryForm({ existing, onClose }: LibraryFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const { mutate: save, isPending } = useCreateStudioLibrary();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = existing?.id ?? slugify(name) + '-' + Date.now().toString(36);

    save(
      {
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        coverImage: existing?.coverImage,
        images: existing?.images ?? [],
      },
      {
        onSuccess: () => {
          toast({ title: existing ? 'Library updated!' : 'Library created!' });
          onClose();
        },
        onError: (err) => {
          toast({ title: 'Failed to save library', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Library Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Faces, Flowers, Comics..."
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of this library..."
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {existing ? 'Update Library' : 'Create Library'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Image Manager (for a single library) ────────────────────────────────────

interface ImageManagerProps {
  library: StudioLibrary;
  onClose: () => void;
}

function ImageManager({ library, onClose }: ImageManagerProps) {
  const { toast } = useToast();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: save, isPending: isSaving } = useCreateStudioLibrary();
  const [images, setImages] = useState<StudioImage[]>(library.images);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingOver, setDraggingOver] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: StudioImage[] = [];
    for (const file of Array.from(files)) {
      try {
        const [[, url]] = await uploadFile(file);
        newImages.push({ url, name: file.name.replace(/\.[^/.]+$/, '') });
      } catch (err) {
        toast({ title: `Failed to upload ${file.name}`, variant: 'destructive' });
      }
    }

    const updated = [...images, ...newImages];
    setImages(updated);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    save(
      {
        id: library.id,
        name: library.name,
        description: library.description,
        coverImage: images[0]?.url ?? library.coverImage,
        images,
      },
      {
        onSuccess: () => {
          toast({ title: 'Images saved to library!' });
          onClose();
        },
        onError: (err) => {
          toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          draggingOver
            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
            : 'border-muted-foreground/30 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDraggingOver(false);
          handleUpload(e.dataTransfer.files);
        }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop images here or click to upload</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, SVG, WebP</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Image grid */}
      <ScrollArea className="h-72">
        {images.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 opacity-30" />
            <p className="text-sm">No images yet. Upload some above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pr-2">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={() => handleRemoveImage(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-black/50 px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex justify-between items-center pt-2">
        <Badge variant="secondary">{images.length} image{images.length !== 1 ? 's' : ''}</Badge>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Library
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────

export function StudioLibrariesAdmin() {
  const { toast } = useToast();
  const { data: libraries, isLoading } = useStudioLibraries();
  const { mutate: deleteLibrary, isPending: isDeleting } = useDeleteStudioLibrary();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<StudioLibrary | null>(null);
  const [managingImages, setManagingImages] = useState<StudioLibrary | null>(null);

  // Filter out deleted libraries
  const activeLibraries = (libraries ?? []).filter((lib) => lib.name !== '__deleted__');

  const handleDelete = (library: StudioLibrary) => {
    deleteLibrary(library.id, {
      onSuccess: () => toast({ title: `Library "${library.name}" deleted` }),
      onError: (err) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            <Library className="h-6 w-6" />
            Pop Art Studio Libraries
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage element libraries for the Pop Art Studio. Users can pick elements from these libraries to design with.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Library
        </Button>
      </div>

      {/* Library grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-40 w-full rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeLibraries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
            <h3 className="text-lg font-semibold mb-2">No libraries yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Create your first pop art element library. You can upload stickers, icons, illustrations, and more.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create First Library
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLibraries.map((lib) => (
            <Card key={lib.id} className="group overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-orange-300">
              {/* Cover */}
              <div className="relative h-40 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 overflow-hidden">
                {lib.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 p-2 h-full">
                    {lib.images.slice(0, 6).map((img, i) => (
                      <div key={i} className="aspect-square rounded overflow-hidden bg-white/50">
                        <img src={img.url} alt={img.name} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground opacity-30" />
                  </div>
                )}
                {/* Action overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setManagingImages(lib)}
                  >
                    <ImagePlus className="h-4 w-4 mr-1" />
                    Manage Images
                  </Button>
                </div>
              </div>

              <CardHeader className="pb-2 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base leading-tight">{lib.name}</CardTitle>
                    {lib.description && (
                      <CardDescription className="text-xs mt-0.5 line-clamp-2">{lib.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {lib.images.length} img{lib.images.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingLibrary(lib)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit Info
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setManagingImages(lib)}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Images
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Library</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{lib.name}"? This will remove all {lib.images.length} images from the studio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(lib)}
                        >
                          Delete Library
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Library Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Library</DialogTitle>
            <DialogDescription>
              Give your library a name. You can add images after creating it.
            </DialogDescription>
          </DialogHeader>
          <LibraryForm onClose={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Library Dialog */}
      <Dialog open={!!editingLibrary} onOpenChange={(open) => !open && setEditingLibrary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Library</DialogTitle>
            <DialogDescription>Update the name and description for this library.</DialogDescription>
          </DialogHeader>
          {editingLibrary && (
            <LibraryForm existing={editingLibrary} onClose={() => setEditingLibrary(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Images Dialog */}
      <Dialog open={!!managingImages} onOpenChange={(open) => !open && setManagingImages(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-orange-500" />
              {managingImages?.name} — Manage Images
            </DialogTitle>
            <DialogDescription>
              Upload pop art elements, stickers, and illustrations to this library.
            </DialogDescription>
          </DialogHeader>
          {managingImages && (
            <ImageManager library={managingImages} onClose={() => setManagingImages(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

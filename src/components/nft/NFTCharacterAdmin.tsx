import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  useNFTCharacters,
  usePublishNFTCharacter,
  useDeleteNFTCharacter,
  type NFTLayer,
} from '@/hooks/useNFTCharacters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  Plus,
  Trash2,
  Upload,
  Layers,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2,
  Pencil,
  ImageIcon,
} from 'lucide-react';

interface LayerFormItem {
  label: string;
  url: string;
  /** only set after upload */
  previewUrl: string;
  uploading: boolean;
}

function emptyLayer(): LayerFormItem {
  return { label: '', url: '', previewUrl: '', uploading: false };
}

interface CharacterFormProps {
  /** If provided, we're editing an existing character */
  existingId?: string;
  initialTitle?: string;
  initialCategory?: string;
  initialLayers?: NFTLayer[];
  onDone: () => void;
}

function CharacterForm({ existingId, initialTitle = '', initialCategory = '', initialLayers = [], onDone }: CharacterFormProps) {
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishCharacter, isPending: isSaving } = usePublishNFTCharacter();

  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [layers, setLayers] = useState<LayerFormItem[]>(
    initialLayers.length > 0
      ? initialLayers.map(l => ({ label: l.label, url: l.url, previewUrl: l.url, uploading: false }))
      : [emptyLayer()]
  );

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleAddLayer = () => {
    setLayers(prev => [...prev, emptyLayer()]);
  };

  const handleRemoveLayer = (idx: number) => {
    setLayers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveLayer = (idx: number, direction: 'up' | 'down') => {
    setLayers(prev => {
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleLayerLabelChange = (idx: number, value: string) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, label: value } : l));
  };

  const handleLayerUrlChange = (idx: number, value: string) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, url: value, previewUrl: value } : l));
  };

  const handleLayerFileUpload = async (idx: number, file: File) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, uploading: true } : l));
    try {
      const tags = await uploadFile(file);
      const url = tags[0]?.[1] || '';
      setLayers(prev => prev.map((l, i) => i === idx ? { ...l, url, previewUrl: url, uploading: false } : l));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
      setLayers(prev => prev.map((l, i) => i === idx ? { ...l, uploading: false } : l));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: 'Please enter a character name', variant: 'destructive' });
      return;
    }
    const validLayers = layers.filter(l => l.url.trim());
    if (validLayers.length === 0) {
      toast({ title: 'Please add at least one layer with an image URL', variant: 'destructive' });
      return;
    }

    publishCharacter(
      {
        title: title.trim(),
        category: category.trim(),
        layers: validLayers.map(l => ({ label: l.label.trim(), url: l.url.trim() })),
        existingId,
      },
      { onSuccess: onDone }
    );
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label>Character Name *</Label>
        <Input
          placeholder="e.g. Bitcoin Traveler"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Input
          placeholder="e.g. travel, crypto, art"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
      </div>

      {/* Layers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Layers
            <span className="text-xs text-muted-foreground">(rendered bottom → top)</span>
          </Label>
          <Button variant="outline" size="sm" onClick={handleAddLayer}>
            <Plus className="h-3 w-3 mr-1" />
            Add Layer
          </Button>
        </div>

        {layers.map((layer, idx) => (
          <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
            {/* Layer header */}
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-muted-foreground">Layer {idx + 1}</span>
              <div className="ml-auto flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveLayer(idx, 'up')} disabled={idx === 0}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveLayer(idx, 'down')} disabled={idx === layers.length - 1}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveLayer(idx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Label */}
            <Input
              placeholder="Layer label (e.g. Body, Hat, Eyes)"
              value={layer.label}
              onChange={e => handleLayerLabelChange(idx, e.target.value)}
              className="h-8 text-sm"
            />

            {/* URL or upload */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Image URL"
                value={layer.url}
                onChange={e => handleLayerUrlChange(idx, e.target.value)}
                className="h-8 text-sm flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                disabled={layer.uploading}
                onClick={() => fileInputRefs.current[idx]?.click()}
              >
                {layer.uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              </Button>
              <input
                ref={el => { fileInputRefs.current[idx] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleLayerFileUpload(idx, file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Preview */}
            {layer.previewUrl && (
              <div className="flex items-center gap-2">
                <img src={layer.previewUrl} alt="layer preview" className="h-12 w-12 object-contain rounded border" />
                <span className="text-xs text-muted-foreground truncate">{layer.previewUrl}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onDone} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          {existingId ? 'Update Character' : 'Create Character'}
        </Button>
      </div>
    </div>
  );
}

export function NFTCharacterAdmin() {
  const { data: characters, isLoading } = useNFTCharacters();
  const { mutate: deleteCharacter } = useDeleteNFTCharacter();
  const adminPubkey = getAdminPubkeyHex();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);

  const editChar = editTarget ? characters?.find(c => c.id === editTarget) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-orange-500" />
                NFT Characters (Nostr Fungible Tokens)
              </CardTitle>
              <CardDescription>
                Upload layered cartoon characters. Visitors can generate random combinations on the /NFT page.
              </CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Character
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create NFT Character</DialogTitle>
                </DialogHeader>
                <CharacterForm onDone={() => setCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {characters.map(char => (
                <div key={char.id} className="group relative border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                  {/* Preview – stack all layers */}
                  <div className="aspect-square relative bg-muted/30">
                    {char.layers.map((layer, i) => (
                      <img
                        key={i}
                        src={layer.url}
                        alt={layer.label}
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ zIndex: i }}
                      />
                    ))}
                  </div>

                  {/* Info */}
                  <div className="p-2 space-y-1">
                    <p className="font-medium text-sm truncate">{char.title}</p>
                    <div className="flex gap-1 flex-wrap">
                      {char.category && <Badge variant="secondary" className="text-xs">{char.category}</Badge>}
                      <Badge variant="outline" className="text-xs">
                        <Layers className="h-2.5 w-2.5 mr-1" />
                        {char.layers.length} layers
                      </Badge>
                    </div>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* Edit */}
                    <Dialog
                      open={editTarget === char.id}
                      onOpenChange={open => setEditTarget(open ? char.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" className="gap-1.5">
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Character</DialogTitle>
                        </DialogHeader>
                        {editChar && (
                          <CharacterForm
                            existingId={editChar.id}
                            initialTitle={editChar.title}
                            initialCategory={editChar.category}
                            initialLayers={editChar.layers}
                            onDone={() => setEditTarget(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="gap-1.5">
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{char.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will publish a deletion event to Nostr. Visitors will no longer see this character.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => deleteCharacter({ characterId: char.id, pubkey: adminPubkey })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No characters yet. Create one to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useEmojiPacks, useCreateEmojiPack, useDeleteEmojiPack } from '@/hooks/useEmojiPacks';
import type { EmojiPack, EmojiItem } from '@/hooks/useEmojiPacks';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  Smile,
  Plus,
  Trash2,
  Edit2,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Package,
  ArrowLeft,
  Save,
} from 'lucide-react';

interface PendingEmoji {
  id: string;
  file: File;
  previewUrl: string;
  shortcode: string;
  uploadedUrl: string | null;
  uploading: boolean;
  error: boolean;
}

// ── Pack Editor dialog ─────────────────────────────────────────────────────────

interface PackEditorProps {
  pack?: EmojiPack | null;       // null/undefined = create new
  onClose: () => void;
}

function PackEditor({ pack, onClose }: PackEditorProps) {
  const { mutateAsync: createPack, isPending: isSaving } = useCreateEmojiPack();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [name, setName] = useState(pack?.name ?? '');
  const [description, setDescription] = useState(pack?.description ?? '');
  const [picture, setPicture] = useState(pack?.picture ?? '');
  const [existingEmojis, setExistingEmojis] = useState<EmojiItem[]>(pack?.emojis ?? []);
  const [pendingEmojis, setPendingEmojis] = useState<PendingEmoji[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const tags = await uploadFile(file);
      setPicture(tags[0][1]);
    } catch {
      // ignore
    } finally {
      setCoverUploading(false);
    }
  };

  const handleEmojiFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPending: PendingEmoji[] = files.map(file => {
      // Derive shortcode from filename: strip extension, replace special chars
      const raw = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        shortcode: raw,
        uploadedUrl: null,
        uploading: true,
        error: false,
      };
    });

    setPendingEmojis(prev => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await Promise.all(newPending.map(async (pe) => {
      try {
        const tags = await uploadFile(pe.file);
        const url = tags[0][1];
        setPendingEmojis(prev =>
          prev.map(p => p.id === pe.id ? { ...p, uploadedUrl: url, uploading: false } : p)
        );
      } catch {
        setPendingEmojis(prev =>
          prev.map(p => p.id === pe.id ? { ...p, uploading: false, error: true } : p)
        );
      }
    }));
  };

  const updatePendingShortcode = (id: string, code: string) => {
    setPendingEmojis(prev => prev.map(p => p.id === id ? { ...p, shortcode: code } : p));
  };

  const removePending = (id: string) => {
    setPendingEmojis(prev => {
      const item = prev.find(p => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const removeExisting = (shortcode: string) => {
    setExistingEmojis(prev => prev.filter(e => e.shortcode !== shortcode));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const allEmojis: EmojiItem[] = [
      ...existingEmojis,
      ...pendingEmojis
        .filter(p => p.uploadedUrl && !p.uploading && !p.error)
        .map(p => ({ shortcode: p.shortcode, url: p.uploadedUrl! })),
    ];

    await createPack({
      dTag: pack?.id,
      name: name.trim(),
      description: description.trim(),
      picture,
      emojis: allEmojis,
    });

    // Cleanup preview URLs
    pendingEmojis.forEach(p => URL.revokeObjectURL(p.previewUrl));
    onClose();
  };

  const isEditing = !!pack;
  const totalEmojis = existingEmojis.length + pendingEmojis.filter(p => p.uploadedUrl).length;

  return (
    <div className="space-y-5 max-h-[80vh] overflow-y-auto">
      {/* Pack Info */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="pack-name">Pack Name *</Label>
          <Input
            id="pack-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. BitPop Emojis"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="pack-desc">Description</Label>
          <Input
            id="pack-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="A short description of this pack"
            className="mt-1"
          />
        </div>

        {/* Cover Image */}
        <div>
          <Label>Cover Image</Label>
          <div className="flex items-center gap-3 mt-1">
            {picture ? (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                <img src={picture} alt="cover" className="w-full h-full object-cover" />
                <button
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  onClick={() => setPicture('')}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                {coverUploading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <ImageIcon className="h-5 w-5 text-gray-400" />}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {coverUploading ? 'Uploading…' : 'Upload Cover'}
            </Button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>
        </div>
      </div>

      {/* Existing emojis */}
      {existingEmojis.length > 0 && (
        <div>
          <Label className="mb-2 block">Emojis in pack ({existingEmojis.length})</Label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {existingEmojis.map(emoji => (
              <div key={emoji.shortcode} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white dark:bg-gray-800 p-1.5 flex flex-col items-center gap-1">
                <img
                  src={emoji.url}
                  alt={emoji.shortcode}
                  className="w-10 h-10 object-contain"
                  loading="lazy"
                />
                <span className="text-[10px] text-muted-foreground text-center truncate w-full">:{emoji.shortcode}:</span>
                <button
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExisting(emoji.shortcode)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new emojis */}
      <div className="space-y-3">
        <Label>Add Emojis</Label>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors border-yellow-300 dark:border-yellow-700">
          <Smile className="h-6 w-6 text-yellow-500 mb-1" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Click to select emoji images</span>
          <span className="text-xs text-muted-foreground mt-0.5">PNG, GIF, SVG — multiple files at once</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.gif,.svg"
            multiple
            className="hidden"
            onChange={handleEmojiFilesSelected}
          />
        </label>

        {pendingEmojis.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {pendingEmojis.map(pe => (
              <div key={pe.id} className="relative rounded-xl overflow-hidden border bg-white dark:bg-gray-800 shadow-sm p-2">
                <div className="aspect-square relative mb-1.5">
                  <img src={pe.previewUrl} alt="emoji" className="w-full h-full object-contain" />
                  {pe.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                  {pe.error && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center rounded">
                      <span className="text-white text-[10px] px-1 text-center">Failed</span>
                    </div>
                  )}
                  {pe.uploadedUrl && (
                    <div className="absolute top-0.5 left-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full"
                    onClick={() => removePending(pe.id)}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
                <Input
                  placeholder="shortcode"
                  value={pe.shortcode}
                  onChange={e => updatePendingShortcode(pe.id, e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase())}
                  className="text-[10px] h-6 px-1.5"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-muted-foreground">
          {totalEmojis} emoji{totalEmojis !== 1 ? 's' : ''} in pack
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving || pendingEmojis.some(p => p.uploading)}
            className="gap-1.5 text-white border-0"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' }}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> {isEditing ? 'Update Pack' : 'Create Pack'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main EmojiPacksAdmin component ────────────────────────────────────────────

interface EmojiPacksAdminProps {
  onBack?: () => void;
}

export function EmojiPacksAdmin({ onBack }: EmojiPacksAdminProps) {
  const { getGradientStyle } = useThemeColors();
  const { data: packs = [], isLoading } = useEmojiPacks();
  const { mutate: deletePack } = useDeleteEmojiPack();

  const [showEditor, setShowEditor] = useState(false);
  const [editingPack, setEditingPack] = useState<EmojiPack | null>(null);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  const openNew = () => { setEditingPack(null); setShowEditor(true); };
  const openEdit = (pack: EmojiPack) => { setEditingPack(pack); setShowEditor(true); };
  const closeEditor = () => { setShowEditor(false); setEditingPack(null); };

  return (
    <div className="space-y-5">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to BitPop Cards
        </Button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smile className="h-7 w-7 text-yellow-500" />
          <div>
            <h2 className="text-xl font-bold">Emoji Packs</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage custom emoji packs — NIP-51 / kind 30030
            </p>
          </div>
        </div>
        <Button
          onClick={openNew}
          className="gap-1.5 text-white border-0"
          style={getGradientStyle('primary')}
        >
          <Plus className="h-4 w-4" />
          New Pack
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{packs.length}</p>
            <p className="text-xs text-muted-foreground">Packs</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <Smile className="h-6 w-6 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {packs.reduce((acc, p) => acc + p.emojis.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Emojis</p>
          </CardContent>
        </Card>
        <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <span className="text-2xl">🎨</span>
            <p className="text-sm font-semibold text-pink-700 dark:text-pink-300 mt-1">NIP-30 / NIP-51</p>
            <p className="text-xs text-muted-foreground">Nostr Standard</p>
          </CardContent>
        </Card>
      </div>

      {/* Pack list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-3" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(j => <Skeleton key={j} className="w-10 h-10 rounded-lg" />)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : packs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Smile className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-muted-foreground mb-3">No emoji packs yet.</p>
            <Button onClick={openNew} style={getGradientStyle('primary')} className="text-white border-0">
              <Plus className="h-4 w-4 mr-1" /> Create Your First Pack
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {packs.map(pack => {
            const isExpanded = expandedPack === pack.id;
            const preview = pack.emojis.slice(0, 6);
            return (
              <Card key={pack.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Cover */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 flex items-center justify-center shrink-0">
                      {pack.picture ? (
                        <img src={pack.picture} alt={pack.name} className="w-full h-full object-cover" />
                      ) : (
                        <Smile className="h-6 w-6 text-yellow-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold truncate">{pack.name}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">{pack.emojis.length} emojis</Badge>
                      </div>
                      {pack.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{pack.description}</p>
                      )}
                      {/* Emoji preview row */}
                      <div className="flex gap-1 mt-1.5">
                        {preview.map(e => (
                          <img
                            key={e.shortcode}
                            src={e.url}
                            alt={e.shortcode}
                            className="w-6 h-6 object-contain"
                            loading="lazy"
                            title={`:${e.shortcode}:`}
                          />
                        ))}
                        {pack.emojis.length > 6 && (
                          <span className="text-xs text-muted-foreground self-center ml-1">+{pack.emojis.length - 6}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => openEdit(pack)}>
                        <Edit2 className="h-3 w-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setExpandedPack(isExpanded ? null : pack.id)}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deletePack(pack.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded emoji grid */}
                  {isExpanded && pack.emojis.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">All {pack.emojis.length} emojis:</p>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {pack.emojis.map(emoji => (
                          <div key={emoji.shortcode} className="flex flex-col items-center gap-0.5" title={`:${emoji.shortcode}:`}>
                            <img src={emoji.url} alt={emoji.shortcode} className="w-8 h-8 object-contain" loading="lazy" />
                            <span className="text-[9px] text-muted-foreground text-center truncate w-full">:{emoji.shortcode}:</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pack Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="max-w-2xl w-full">
          <DialogTitle>{editingPack ? `Edit: ${editingPack.name}` : 'Create New Emoji Pack'}</DialogTitle>
          <PackEditor pack={editingPack} onClose={closeEditor} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

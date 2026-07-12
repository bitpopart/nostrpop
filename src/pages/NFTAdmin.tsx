import { useState, useRef, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import {
  useNFTCharacters,
  usePublishNFTCharacter,
  useDeleteNFTCharacter,
  type NFTCharacter,
} from '@/hooks/useNFTCharacters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  Plus,
  Trash2,
  Upload,
  Layers,
  ArrowUp,
  ArrowDown,
  Loader2,
  ImageIcon,
  Shield,
  ChevronRight,
  ExternalLink,
  Save,
  X,
  Eye,
  GripVertical,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  PenLine,
  Shuffle,
  Images,
  Blocks,
} from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantItem {
  url: string;
  uploading: boolean;
}

interface LayerGroupForm {
  name: string;
  variants: VariantItem[];
}

function emptyLayerGroup(): LayerGroupForm {
  return { name: '', variants: [{ url: '', uploading: false }] };
}

// ─── Live preview: picks one random variant per group ─────────────────────────

function LayerPreview({ groups, size = 220 }: { groups: LayerGroupForm[]; size?: number }) {
  // Pick first non-empty variant for preview (not random — just stable preview)
  const urls = groups
    .map(g => g.variants.find(v => v.url.trim())?.url ?? '')
    .filter(Boolean);

  if (urls.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-muted/40 rounded-xl border-2 border-dashed text-muted-foreground gap-2"
        style={{ width: size, height: size }}
      >
        <ImageIcon className="h-8 w-8 opacity-30" />
        <span className="text-xs opacity-50">No layers yet</span>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30"
      style={{ width: size, height: size }}
    >
      {urls.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`layer ${i}`}
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: i }}
        />
      ))}
    </div>
  );
}

// ─── Single variant row ───────────────────────────────────────────────────────

interface VariantRowProps {
  variant: VariantItem;
  index: number;
  canRemove: boolean;
  onUrlChange: (url: string) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  fileRef: (el: HTMLInputElement | null) => void;
  triggerFileInput: () => void;
}

function VariantRow({
  variant, index, canRemove,
  onUrlChange, onUpload, onRemove,
  fileRef, triggerFileInput,
}: VariantRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Thumbnail */}
      <div className="w-8 h-8 rounded border bg-muted/40 shrink-0 overflow-hidden flex items-center justify-center">
        {variant.url ? (
          <img src={variant.url} alt="" crossOrigin="anonymous" className="w-full h-full object-contain" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
        )}
      </div>

      {/* URL */}
      <Input
        placeholder={`Variant ${index + 1} URL`}
        value={variant.url}
        onChange={e => onUrlChange(e.target.value)}
        className="h-8 text-xs font-mono flex-1"
      />

      {/* Upload */}
      <Button
        variant="outline" size="icon" className="h-8 w-8 shrink-0"
        disabled={variant.uploading}
        onClick={triggerFileInput}
        title="Upload image"
      >
        {variant.uploading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Upload className="h-3 w-3" />
        }
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp,image/svg+xml,image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />

      {/* Status / Remove */}
      {variant.url && !variant.uploading && (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      )}
      {canRemove && (
        <Button
          variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          onClick={onRemove}
          title="Remove variant"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ─── Edit / Create panel ──────────────────────────────────────────────────────

interface EditPanelProps {
  character?: NFTCharacter | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
  /** Pre-fill category when creating a new character */
  defaultCategory?: string;
}

function EditPanel({ character, onSaved, onCancel, defaultCategory }: EditPanelProps) {
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishCharacter, isPending: isSaving } = usePublishNFTCharacter();

  const isNew = !character;

  const [title, setTitle] = useState(character?.title ?? '');
  const [category, setCategory] = useState(character?.category ?? defaultCategory ?? '');
  const [groups, setGroups] = useState<LayerGroupForm[]>(() => {
    if (character && character.layerGroups.length > 0) {
      return character.layerGroups.map(g => ({
        name: g.name,
        variants: g.variants.length > 0
          ? g.variants.map(url => ({ url, uploading: false }))
          : [{ url: '', uploading: false }],
      }));
    }
    return [emptyLayerGroup()];
  });

  // File input refs: single variant uploads keyed "g-v", bulk keyed "bulk-g"
  const fileRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const refKey = (g: number, v: number) => `${g}-${v}`;
  const bulkKey = (g: number) => `bulk-${g}`;

  // Reset when character changes
  useEffect(() => {
    setTitle(character?.title ?? '');
    setCategory(character?.category ?? defaultCategory ?? '');
    setGroups(
      character && character.layerGroups.length > 0
        ? character.layerGroups.map(g => ({
            name: g.name,
            variants: g.variants.length > 0
              ? g.variants.map(url => ({ url, uploading: false }))
              : [{ url: '', uploading: false }],
          }))
        : [emptyLayerGroup()]
    );
  }, [character?.id]);

  // ── Group operations ──

  const addGroup = () => setGroups(prev => [...prev, emptyLayerGroup()]);

  const removeGroup = (gi: number) => {
    if (groups.length === 1) return;
    setGroups(prev => prev.filter((_, i) => i !== gi));
  };

  const moveGroup = (gi: number, dir: 'up' | 'down') => {
    setGroups(prev => {
      const next = [...prev];
      const swap = dir === 'up' ? gi - 1 : gi + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[gi], next[swap]] = [next[swap], next[gi]];
      return next;
    });
  };

  const setGroupName = (gi: number, name: string) =>
    setGroups(prev => prev.map((g, i) => i === gi ? { ...g, name } : g));

  // ── Variant operations ──

  const addVariant = (gi: number) =>
    setGroups(prev => prev.map((g, i) =>
      i === gi ? { ...g, variants: [...g.variants, { url: '', uploading: false }] } : g
    ));

  const removeVariant = (gi: number, vi: number) =>
    setGroups(prev => prev.map((g, i) =>
      i === gi ? { ...g, variants: g.variants.filter((_, j) => j !== vi) } : g
    ));

  const setVariantUrl = (gi: number, vi: number, url: string) =>
    setGroups(prev => prev.map((g, i) =>
      i === gi
        ? { ...g, variants: g.variants.map((v, j) => j === vi ? { ...v, url } : v) }
        : g
    ));

  const setVariantUploading = (gi: number, vi: number, uploading: boolean) =>
    setGroups(prev => prev.map((g, i) =>
      i === gi
        ? { ...g, variants: g.variants.map((v, j) => j === vi ? { ...v, uploading } : v) }
        : g
    ));

  const handleUpload = async (gi: number, vi: number, file: File) => {
    setVariantUploading(gi, vi, true);
    try {
      const tags = await uploadFile(file);
      const url = tags[0]?.[1] || '';
      setGroups(prev => prev.map((g, i) =>
        i === gi
          ? { ...g, variants: g.variants.map((v, j) => j === vi ? { url, uploading: false } : v) }
          : g
      ));
      toast({ title: 'Image uploaded!' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
      setVariantUploading(gi, vi, false);
    }
  };

  // ── Bulk upload: multiple files at once for a layer group ──

  const handleBulkUpload = async (gi: number, files: FileList) => {
    if (files.length === 0) return;
    const fileArray = Array.from(files);

    // Append placeholder slots for each file, all marked uploading
    const placeholders: VariantItem[] = fileArray.map(() => ({ url: '', uploading: true }));
    let startIndex = 0;
    setGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g;
      // Remove empty trailing slot if present, then append placeholders
      const existing = g.variants.filter(v => v.url.trim() || v.uploading);
      startIndex = existing.length;
      return { ...g, variants: [...existing, ...placeholders] };
    }));

    // Upload all in parallel
    await Promise.all(
      fileArray.map(async (file, fi) => {
        const vi = startIndex + fi;
        try {
          const tags = await uploadFile(file);
          const url = tags[0]?.[1] || '';
          setGroups(prev => prev.map((g, i) =>
            i === gi
              ? { ...g, variants: g.variants.map((v, j) => j === vi ? { url, uploading: false } : v) }
              : g
          ));
        } catch {
          // Mark as failed (empty url, not uploading)
          setGroups(prev => prev.map((g, i) =>
            i === gi
              ? { ...g, variants: g.variants.map((v, j) => j === vi ? { url: '', uploading: false } : v) }
              : g
          ));
        }
      })
    );

    toast({ title: `${fileArray.length} image${fileArray.length !== 1 ? 's' : ''} uploaded!` });
  };

  // ── Submit ──

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: 'Character name is required', variant: 'destructive' });
      return;
    }
    const validGroups = groups
      .map(g => ({
        name: g.name.trim(),
        variants: g.variants.map(v => v.url.trim()).filter(Boolean),
      }))
      .filter(g => g.variants.length > 0);

    if (validGroups.length === 0) {
      toast({ title: 'Add at least one layer with an image', variant: 'destructive' });
      return;
    }

    publishCharacter(
      {
        title: title.trim(),
        category: category.trim(),
        layerGroups: validGroups,
        existingId: character?.id,
      },
      { onSuccess: (data) => onSaved(data.id) }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b shrink-0">
        <div className="flex items-center gap-2">
          {isNew
            ? <Plus className="h-5 w-5 text-orange-500" />
            : <PenLine className="h-5 w-5 text-orange-500" />
          }
          <h2 className="font-bold text-lg">
            {isNew ? 'New Character' : `Edit: ${character?.title}`}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Live Preview */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Live Preview (first variant per layer)
          </span>
          <LayerPreview groups={groups} size={220} />
          <span className="text-xs text-muted-foreground">
            {groups.filter(g => g.variants.some(v => v.url)).length} layer{groups.length !== 1 ? 's' : ''} · bottom → top
          </span>
        </div>

        <Separator />

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="char-title" className="font-semibold">Character Name *</Label>
          <Input
            id="char-title"
            placeholder="e.g. Bitcoin Traveler"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="char-category" className="font-semibold">Category</Label>
          <Input
            id="char-category"
            placeholder="e.g. travel, crypto, art, block"
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
          {category === 'block' ? (
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <Blocks className="h-3 w-3" />
              This character will power the <strong>/Block</strong> page art generator
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Used for filtering on the /NFT page. Use <code className="bg-muted px-1 rounded">block</code> to power the /Block page.</p>
          )}
        </div>

        <Separator />

        {/* Layer Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-500" />
              Layers
              <span className="text-xs font-normal text-muted-foreground">(each layer picks a random variant on generate)</span>
            </Label>
            <Button variant="outline" size="sm" onClick={addGroup} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Layer
            </Button>
          </div>

          {groups.map((group, gi) => (
            <div
              key={gi}
              className="border-2 rounded-xl bg-card hover:border-orange-200 dark:hover:border-orange-800 transition-colors overflow-hidden"
            >
              {/* Layer group header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

                <Badge variant="outline" className="text-xs shrink-0 font-mono">
                  Layer {gi + 1}
                </Badge>

                {/* Layer name input */}
                <Input
                  placeholder="Layer name (e.g. Background, Hat, Body)"
                  value={group.name}
                  onChange={e => setGroupName(gi, e.target.value)}
                  className="h-7 text-sm flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 font-medium"
                />

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => moveGroup(gi, 'up')} disabled={gi === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => moveGroup(gi, 'down')} disabled={gi === groups.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeGroup(gi)}
                    disabled={groups.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Variants */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Images className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {group.variants.filter(v => v.url).length} variant{group.variants.filter(v => v.url).length !== 1 ? 's' : ''} · one picked randomly
                  </span>
                  {group.variants.length > 1 && (
                    <Badge variant="secondary" className="text-xs ml-auto gap-1">
                      <Shuffle className="h-2.5 w-2.5" />
                      Random
                    </Badge>
                  )}
                </div>

                {group.variants.map((variant, vi) => (
                  <VariantRow
                    key={vi}
                    variant={variant}
                    index={vi}
                    canRemove={group.variants.length > 1}
                    onUrlChange={url => setVariantUrl(gi, vi, url)}
                    onUpload={file => handleUpload(gi, vi, file)}
                    onRemove={() => removeVariant(gi, vi)}
                    fileRef={el => fileRefs.current.set(refKey(gi, vi), el)}
                    triggerFileInput={() => fileRefs.current.get(refKey(gi, vi))?.click()}
                  />
                ))}

                <div className="flex gap-2 mt-1">
                  <Button
                    variant="ghost" size="sm" className="flex-1 h-7 text-xs text-muted-foreground gap-1.5 border border-dashed hover:border-orange-300 hover:text-orange-600"
                    onClick={() => addVariant(gi)}
                  >
                    <Plus className="h-3 w-3" />
                    Add variant
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="flex-1 h-7 text-xs text-muted-foreground gap-1.5 border border-dashed hover:border-orange-300 hover:text-orange-600"
                    onClick={() => fileRefs.current.get(bulkKey(gi))?.click()}
                  >
                    <Upload className="h-3 w-3" />
                    Upload multiple
                  </Button>
                  <input
                    ref={el => fileRefs.current.set(bulkKey(gi), el)}
                    type="file"
                    accept="image/png,image/webp,image/svg+xml,image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) handleBulkUpload(gi, e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t shrink-0 space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white gap-2"
          size="lg"
        >
          {isSaving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <><Save className="h-4 w-4" /> {isNew ? 'Publish Character' : 'Save Changes'}</>
          }
        </Button>
        <Button variant="outline" onClick={onCancel} className="w-full" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Character list item ──────────────────────────────────────────────────────

interface CharacterListItemProps {
  character: NFTCharacter;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function CharacterListItem({ character, isSelected, onSelect, onDelete }: CharacterListItemProps) {
  // Thumbnail: stack first variant of each layer group
  const previewUrls = character.layerGroups.map(g => g.variants[0]).filter(Boolean);
  const totalVariants = character.layerGroups.reduce((sum, g) => sum + g.variants.length, 0);

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
        isSelected
          ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
          : 'border-transparent hover:border-orange-200 dark:hover:border-orange-800 hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted/40 shrink-0 border">
        {previewUrls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: i }}
          />
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{character.title}</p>
        <div className="flex gap-1 flex-wrap mt-0.5">
          {character.category && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{character.category}</Badge>
          )}
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            <Layers className="h-2.5 w-2.5 mr-0.5" />
            {character.layerGroups.length}
          </Badge>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            <Images className="h-2.5 w-2.5 mr-0.5" />
            {totalVariants}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isSelected && <ChevronRight className="h-4 w-4 text-orange-500" />}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={e => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{character.title}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This publishes a Nostr deletion event. The character will be removed from the /NFT page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={onDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Reusable character-list workspace ───────────────────────────────────────

interface CharacterWorkspaceProps {
  /** If set, only show characters with this category; "block" tab uses "block", NFT tab excludes it */
  filterCategory?: string;
  /** If set, pre-fill this category when creating new character */
  defaultCategory?: string;
  /** Title shown in sidebar header */
  sidebarTitle: string;
  /** Label for the New button */
  newLabel: string;
  /** Empty-state headline */
  emptyHeadline: string;
  /** Empty-state description */
  emptyDescription: string;
  characters: ReturnType<typeof useNFTCharacters>['data'];
  isLoading: boolean;
  deleteCharacter: (args: { characterId: string; pubkey: string }) => void;
}

function CharacterWorkspace({
  filterCategory,
  defaultCategory,
  sidebarTitle,
  newLabel,
  emptyHeadline,
  emptyDescription,
  characters,
  isLoading,
  deleteCharacter,
}: CharacterWorkspaceProps) {
  type PanelMode = 'none' | 'create' | 'edit';
  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter by category if specified
  const filtered = characters
    ? filterCategory
      ? characters.filter(c => c.category === filterCategory)
      : characters.filter(c => c.category !== 'block')
    : [];

  const selectedChar = selectedId ? (filtered.find(c => c.id === selectedId) ?? null) : null;

  const handleSelectCharacter = (id: string) => { setSelectedId(id); setPanelMode('edit'); };
  const handleNew = () => { setSelectedId(null); setPanelMode('create'); };
  const handleSaved = (id: string) => { setSelectedId(id); setPanelMode('edit'); };
  const handleClose = () => { setPanelMode('none'); setSelectedId(null); };

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 6.5rem)' }}>
      {/* Left: list */}
      <aside className={`flex flex-col border-r bg-background transition-all duration-200 ${
        panelMode !== 'none' ? 'w-72 shrink-0' : 'flex-1'
      }`}>
        <div className="p-4 border-b shrink-0 flex items-center justify-between">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{sidebarTitle}</h2>
          <Badge variant="secondary" className="text-xs">
            {isLoading ? '…' : filtered.length}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map(char => (
              <CharacterListItem
                key={char.id}
                character={char}
                isSelected={selectedId === char.id}
                onSelect={() => handleSelectCharacter(char.id)}
                onDelete={() => deleteCharacter({ characterId: char.id, pubkey: ADMIN_PUBKEY })}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No characters yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Click "{newLabel}" to get started</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t shrink-0">
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleNew}>
            <Plus className="h-3.5 w-3.5" />
            {newLabel}
          </Button>
        </div>
      </aside>

      {/* Right: edit panel */}
      {panelMode !== 'none' && (
        <main className="flex-1 overflow-hidden bg-background">
          <EditPanel
            key={panelMode === 'create' ? `create-${defaultCategory}` : selectedId ?? 'edit'}
            character={panelMode === 'edit' ? selectedChar : null}
            defaultCategory={panelMode === 'create' ? (defaultCategory ?? '') : undefined}
            onSaved={handleSaved}
            onCancel={handleClose}
          />
        </main>
      )}

      {/* Empty state */}
      {panelMode === 'none' && filtered.length === 0 && !isLoading && (
        <main className="flex-1 flex items-center justify-center bg-muted/10">
          <div className="text-center space-y-4 p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 flex items-center justify-center mx-auto">
              <Blocks className="h-10 w-10 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{emptyHeadline}</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">{emptyDescription}</p>
            </div>
            <Button
              onClick={handleNew}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              {newLabel}
            </Button>
          </div>
        </main>
      )}

      {/* Select prompt */}
      {panelMode === 'none' && filtered.length > 0 && (
        <main className="flex-1 hidden md:flex items-center justify-center bg-muted/10">
          <div className="text-center space-y-3 p-8">
            <PenLine className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">Select a character to edit, or create a new one</p>
            <Button onClick={handleNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              {newLabel}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type AdminTab = 'block' | 'nft';

export default function NFTAdmin() {
  useSeoMeta({
    title: 'NFT Admin – BitPopArt',
    description: 'Manage Block Art layers and NFT characters.',
    robots: 'noindex, nofollow',
  });

  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  const { data: characters, isLoading, refetch, isFetching } = useNFTCharacters();
  const { mutate: deleteCharacter } = useDeleteNFTCharacter();

  const [activeTab, setActiveTab] = useState<AdminTab>('block');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-background dark:to-pink-950/20 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-2 text-orange-500" />
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Sign in with your admin account to manage art layers.</CardDescription>
          </CardHeader>
          <CardContent><LoginArea className="w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-background dark:to-pink-950/20 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-destructive/40">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-2 text-destructive" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>Only the admin can manage art layers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/NFT')} variant="outline" className="w-full">
              Go to /NFT page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const blockCharCount = characters?.filter(c => c.category === 'block').length ?? 0;
  const nftCharCount = characters?.filter(c => c.category !== 'block').length ?? 0;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 px-5 h-14">
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <span className="font-black text-base tracking-tight">Art Admin</span>
            <Badge variant="outline" className="text-xs ml-1">Backend</Badge>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('block')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'block'
                  ? 'bg-background text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Blocks className="h-3.5 w-3.5" />
              Block Art
              {blockCharCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4 ml-0.5">{blockCharCount}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('nft')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'nft'
                  ? 'bg-background text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              NFT Characters
              {nftCharCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4 ml-0.5">{nftCharCount}</Badge>
              )}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => refetch()} disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => navigate(activeTab === 'block' ? '/Block' : '/NFT')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View {activeTab === 'block' ? '/Block' : '/NFT'}</span>
            </Button>
          </div>
        </div>

        {/* Block Art info bar */}
        {activeTab === 'block' && (
          <div className="px-5 py-2 bg-orange-50/60 dark:bg-orange-950/20 border-t border-orange-100 dark:border-orange-900/30 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <Blocks className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span>
              The <strong className="text-foreground">Block</strong> character (category = <code className="bg-muted px-1 rounded">block</code>) powers the{' '}
              <strong className="text-foreground">/Block</strong> page — its layers are randomly composited with the actual Bitcoin block number overlaid on top.
              Add as many layers &amp; variants as you like; the RNG seed is the block height so every block gets a unique, deterministic image.
            </span>
          </div>
        )}
      </header>

      {/* Tab content */}
      {activeTab === 'block' ? (
        <CharacterWorkspace
          key="block-workspace"
          filterCategory="block"
          defaultCategory="block"
          sidebarTitle="Block Character"
          newLabel="New Block Character"
          emptyHeadline="Create the Block character"
          emptyDescription={
            'Add a character with category "block". Upload background layers, body layers, and any other art layers — each with multiple variants. Every Bitcoin block will get a unique random combination!'
          }
          characters={characters}
          isLoading={isLoading}
          deleteCharacter={deleteCharacter}
        />
      ) : (
        <CharacterWorkspace
          key="nft-workspace"
          defaultCategory=""
          sidebarTitle="NFT Characters"
          newLabel="New Character"
          emptyHeadline="Create your first NFT character"
          emptyDescription="Add named layers (Background, Body, Hat…) with multiple variant images — one is picked randomly on generate."
          characters={characters}
          isLoading={isLoading}
          deleteCharacter={deleteCharacter}
        />
      )}
    </div>
  );
}

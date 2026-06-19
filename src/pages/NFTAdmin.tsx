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
  type NFTLayer,
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
} from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

// ─── Layer form item ──────────────────────────────────────────────────────────

interface LayerFormItem {
  label: string;
  url: string;
  uploading: boolean;
}

function emptyLayer(): LayerFormItem {
  return { label: '', url: '', uploading: false };
}

// ─── Layer preview stack ──────────────────────────────────────────────────────

function LayerStack({ urls, size = 200 }: { urls: string[]; size?: number }) {
  if (urls.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/40 rounded-xl border-2 border-dashed text-muted-foreground"
        style={{ width: size, height: size }}
      >
        <ImageIcon className="h-8 w-8 opacity-30" />
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

// ─── Edit / Create form panel ─────────────────────────────────────────────────

interface EditPanelProps {
  character?: NFTCharacter | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
}

function EditPanel({ character, onSaved, onCancel }: EditPanelProps) {
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishCharacter, isPending: isSaving } = usePublishNFTCharacter();

  const isNew = !character;

  const [title, setTitle] = useState(character?.title ?? '');
  const [category, setCategory] = useState(character?.category ?? '');
  const [layers, setLayers] = useState<LayerFormItem[]>(
    character && character.layers.length > 0
      ? character.layers.map(l => ({ label: l.label, url: l.url, uploading: false }))
      : [emptyLayer()]
  );

  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset when character changes
  useEffect(() => {
    setTitle(character?.title ?? '');
    setCategory(character?.category ?? '');
    setLayers(
      character && character.layers.length > 0
        ? character.layers.map(l => ({ label: l.label, url: l.url, uploading: false }))
        : [emptyLayer()]
    );
  }, [character?.id]);

  const handleAddLayer = () => setLayers(prev => [...prev, emptyLayer()]);

  const handleRemoveLayer = (idx: number) => {
    if (layers.length === 1) return;
    setLayers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, dir: 'up' | 'down') => {
    setLayers(prev => {
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const handleLabelChange = (idx: number, val: string) =>
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, label: val } : l));

  const handleUrlChange = (idx: number, val: string) =>
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, url: val } : l));

  const handleFileUpload = async (idx: number, file: File) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, uploading: true } : l));
    try {
      const tags = await uploadFile(file);
      const url = tags[0]?.[1] || '';
      setLayers(prev => prev.map((l, i) => i === idx ? { ...l, url, uploading: false } : l));
      toast({ title: 'Image uploaded!' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
      setLayers(prev => prev.map((l, i) => i === idx ? { ...l, uploading: false } : l));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: 'Character name is required', variant: 'destructive' });
      return;
    }
    const validLayers = layers.filter(l => l.url.trim());
    if (validLayers.length === 0) {
      toast({ title: 'Add at least one layer image', variant: 'destructive' });
      return;
    }
    publishCharacter(
      {
        title: title.trim(),
        category: category.trim(),
        layers: validLayers.map(l => ({ label: l.label.trim(), url: l.url.trim() })),
        existingId: character?.id,
      },
      {
        onSuccess: (data) => {
          onSaved(data.id);
        },
      }
    );
  };

  const validLayerUrls = layers.filter(l => l.url.trim()).map(l => l.url);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between p-5 border-b shrink-0">
        <div className="flex items-center gap-2">
          {isNew ? (
            <Plus className="h-5 w-5 text-orange-500" />
          ) : (
            <PenLine className="h-5 w-5 text-orange-500" />
          )}
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
            <Eye className="h-3.5 w-3.5" /> Live Preview
          </span>
          <LayerStack urls={validLayerUrls} size={220} />
          <span className="text-xs text-muted-foreground">
            {validLayerUrls.length} layer{validLayerUrls.length !== 1 ? 's' : ''} · layers rendered bottom → top
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
            placeholder="e.g. travel, crypto, art"
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Used for filtering on the /NFT page</p>
        </div>

        <Separator />

        {/* Layers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-500" />
              Layers
            </Label>
            <Button variant="outline" size="sm" onClick={handleAddLayer} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Layer
            </Button>
          </div>

          {layers.map((layer, idx) => (
            <div
              key={idx}
              className="border rounded-xl p-3 space-y-2.5 bg-card hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
            >
              {/* Layer header row */}
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Badge variant="outline" className="text-xs shrink-0">Layer {idx + 1}</Badge>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => handleMove(idx, 'up')} disabled={idx === 0}
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => handleMove(idx, 'down')} disabled={idx === layers.length - 1}
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveLayer(idx)}
                    disabled={layers.length === 1}
                    title="Remove layer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Label */}
              <Input
                placeholder="Layer label (e.g. Body, Hat, Eyes, Background)"
                value={layer.label}
                onChange={e => handleLabelChange(idx, e.target.value)}
                className="h-8 text-sm"
              />

              {/* URL + upload */}
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL (or upload below)"
                  value={layer.url}
                  onChange={e => handleUrlChange(idx, e.target.value)}
                  className="h-8 text-sm flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline" size="sm" className="h-8 shrink-0 gap-1.5"
                  disabled={layer.uploading}
                  onClick={() => fileRefs.current[idx]?.click()}
                >
                  {layer.uploading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Upload className="h-3.5 w-3.5" />
                  }
                  Upload
                </Button>
                <input
                  ref={el => { fileRefs.current[idx] = el; }}
                  type="file"
                  accept="image/png,image/webp,image/svg+xml,image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(idx, file);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Thumbnail */}
              {layer.url && (
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-1.5">
                  <img
                    src={layer.url}
                    alt="preview"
                    className="h-10 w-10 object-contain rounded border bg-white shrink-0"
                    crossOrigin="anonymous"
                  />
                  <span className="text-xs text-muted-foreground break-all line-clamp-2">{layer.url}</span>
                  {layer.uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500 shrink-0" />
                  )}
                  {!layer.uploading && layer.url && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions — always visible */}
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
        {character.layers.map((layer, i) => (
          <img
            key={i}
            src={layer.url}
            alt={layer.label}
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
            {character.layers.length}
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
              title="Delete"
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

// ─── Main page ────────────────────────────────────────────────────────────────

type PanelMode = 'none' | 'create' | 'edit';

export default function NFTAdmin() {
  useSeoMeta({
    title: 'NFT Admin – BitPopArt',
    description: 'Manage Nostr Fungible Token characters and layers.',
    robots: 'noindex, nofollow',
  });

  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  const { data: characters, isLoading, refetch, isFetching } = useNFTCharacters();
  const { mutate: deleteCharacter } = useDeleteNFTCharacter();

  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedChar = selectedId ? (characters?.find(c => c.id === selectedId) ?? null) : null;

  const handleSelectCharacter = (id: string) => {
    setSelectedId(id);
    setPanelMode('edit');
  };

  const handleNewCharacter = () => {
    setSelectedId(null);
    setPanelMode('create');
  };

  const handleSaved = (id: string) => {
    setSelectedId(id);
    setPanelMode('edit');
  };

  const handleClosePanel = () => {
    setPanelMode('none');
    setSelectedId(null);
  };

  // ── Auth guards ──

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-background dark:to-pink-950/20 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-2 text-orange-500" />
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Sign in with your admin account to manage NFT characters.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginArea className="w-full" />
          </CardContent>
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
            <CardDescription>Only the admin can manage NFT characters.</CardDescription>
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

  // ── Main layout ──

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 px-5 h-14">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <span className="font-black text-base tracking-tight">NFT Admin</span>
            <Badge variant="outline" className="text-xs ml-1">Backend</Badge>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Stats */}
          <span className="text-sm text-muted-foreground hidden sm:block">
            {isLoading ? '…' : `${characters?.length ?? 0} character${characters?.length !== 1 ? 's' : ''}`}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => navigate('/NFT')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View /NFT</span>
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
              onClick={handleNewCharacter}
            >
              <Plus className="h-3.5 w-3.5" />
              New Character
            </Button>
          </div>
        </div>
      </header>

      {/* Main 2-column layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>

        {/* ── Left: character list ── */}
        <aside className={`flex flex-col border-r bg-background transition-all duration-200 ${
          panelMode !== 'none' ? 'w-72 shrink-0' : 'flex-1'
        }`}>
          {/* Sidebar header */}
          <div className="p-4 border-b shrink-0">
            <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Characters</h2>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            ) : characters && characters.length > 0 ? (
              characters.map(char => (
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
                <p className="text-xs text-muted-foreground/70 mt-1">Click "New Character" to get started</p>
              </div>
            )}
          </div>

          {/* Bottom new button (when panel is open and sidebar is narrow) */}
          {panelMode !== 'none' && (
            <div className="p-3 border-t shrink-0">
              <Button
                variant="outline" size="sm" className="w-full gap-1.5"
                onClick={handleNewCharacter}
              >
                <Plus className="h-3.5 w-3.5" />
                New Character
              </Button>
            </div>
          )}
        </aside>

        {/* ── Right: empty state or edit panel ── */}
        {panelMode === 'none' ? null : (
          <main className="flex-1 overflow-hidden bg-background">
            <EditPanel
              key={panelMode === 'create' ? 'create' : selectedId ?? 'edit'}
              character={panelMode === 'edit' ? selectedChar : null}
              onSaved={handleSaved}
              onCancel={handleClosePanel}
            />
          </main>
        )}

        {/* Empty state when no panel open and list empty */}
        {panelMode === 'none' && characters && characters.length === 0 && !isLoading && (
          <main className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center space-y-4 p-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Create your first NFT character</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Upload layered cartoon images. Visitors can generate and download unique combinations on the /NFT page.
                </p>
              </div>
              <Button
                onClick={handleNewCharacter}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white gap-2"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Create First Character
              </Button>
            </div>
          </main>
        )}

        {/* Prompt to select or create when characters exist but nothing selected */}
        {panelMode === 'none' && characters && characters.length > 0 && (
          <main className="flex-1 hidden md:flex items-center justify-center bg-muted/10">
            <div className="text-center space-y-3 p-8">
              <PenLine className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">Select a character to edit, or create a new one</p>
              <Button
                onClick={handleNewCharacter}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Character
              </Button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

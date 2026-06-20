/**
 * AvatarGeneratorCanvas
 *
 * Shown inside the Studio when the user picks "Avatar Generator" as the format.
 * It fetches the NFT characters the admin has enabled for the generator and lets
 * the user compose their avatar by choosing one option per layer group, then
 * download the result as a 1024×1024 PNG.
 *
 * The top format-picker buttons remain visible so the user can switch back to
 * any other canvas at any time.
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RelaySelector } from '@/components/RelaySelector';
import { useAvatarGeneratorNFTs } from '@/hooks/useAvatarGenerator';
import type { NFTCharacter, NFTLayerGroup } from '@/hooks/useNFTCharacters';
import {
  Shuffle,
  Download,
  Layers,
  Images,
  Expand,
  X,
  UserCircle2,
  Wand2,
} from 'lucide-react';

// ─── Canvas compositor ────────────────────────────────────────────────────────

async function compositeLayers(urls: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (urls.length === 0) return reject(new Error('No layers'));

    const images: HTMLImageElement[] = [];
    let loaded = 0;

    urls.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        images[i] = img;
        loaded++;
        if (loaded === urls.length) {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context unavailable'));

          images.forEach(img => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          });

          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load layer ${i}: ${url}`));
      img.src = url;
    });
  });
}

// ─── Single character generator ───────────────────────────────────────────────

interface SingleCharacterGeneratorProps {
  character: NFTCharacter;
}

function SingleCharacterGenerator({ character }: SingleCharacterGeneratorProps) {
  const { layerGroups } = character;

  // Per-layer selected variant index (default = 0)
  const [selections, setSelections] = useState<number[]>(() =>
    layerGroups.map(() => 0)
  );
  const [composited, setComposited] = useState<string | null>(null);
  const [isCompositing, setIsCompositing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentUrls = layerGroups.map((g, i) => g.variants[selections[i]] ?? g.variants[0]).filter(Boolean);

  // Randomise all layers
  const handleRandomise = useCallback(async () => {
    const newSelections = layerGroups.map(g => Math.floor(Math.random() * g.variants.length));
    setSelections(newSelections);
    setComposited(null);

    // Composite new random pick
    const urls = layerGroups.map((g, i) => g.variants[newSelections[i]] ?? g.variants[0]).filter(Boolean);
    setIsCompositing(true);
    try {
      const dataUrl = await compositeLayers(urls);
      setComposited(dataUrl);
    } catch {
      setComposited(null);
    } finally {
      setIsCompositing(false);
    }
  }, [layerGroups]);

  // Pick a specific variant for a layer
  const handlePickVariant = useCallback(async (layerIdx: number, variantIdx: number) => {
    const newSel = selections.map((s, i) => i === layerIdx ? variantIdx : s);
    setSelections(newSel);
    setComposited(null);

    const urls = layerGroups.map((g, i) => g.variants[newSel[i]] ?? g.variants[0]).filter(Boolean);
    setIsCompositing(true);
    try {
      const dataUrl = await compositeLayers(urls);
      setComposited(dataUrl);
    } catch {
      setComposited(null);
    } finally {
      setIsCompositing(false);
    }
  }, [selections, layerGroups]);

  const handleDownload = () => {
    if (!composited) return;
    const a = document.createElement('a');
    a.href = composited;
    a.download = `${character.title.replace(/\s+/g, '-')}-avatar.png`;
    a.click();
  };

  const totalVariants = layerGroups.reduce((s, g) => s + g.variants.length, 0);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col items-center gap-3">

        {/* ── Preview + actions ── */}
        <div className="flex flex-col items-center gap-3">
          {/* Preview square */}
          <div
            className="relative w-64 h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950 dark:to-purple-900 border-2 border-violet-200 dark:border-violet-700 shadow-xl cursor-zoom-in"
            onClick={() => setPreviewOpen(true)}
          >
            {isCompositing && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
                <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full animate-pulse">Rendering…</div>
              </div>
            )}

            {composited ? (
              <img src={composited} alt={character.title} className="w-full h-full object-contain" />
            ) : (
              currentUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ zIndex: i }}
                  crossOrigin="anonymous"
                />
              ))
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 z-10">
              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Expand className="h-3 w-3" /> View full size
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1 text-violet-600 border-violet-300">
              <Layers className="h-3 w-3" /> {layerGroups.length} layers
            </Badge>
            <Badge variant="outline" className="gap-1 text-violet-600 border-violet-300">
              <Images className="h-3 w-3" /> {totalVariants} variants
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-64">
            <Button
              onClick={handleRandomise}
              disabled={isCompositing}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white gap-1.5"
              size="sm"
            >
              <Shuffle className="h-3.5 w-3.5" />
              {isCompositing ? 'Rendering…' : 'Randomise'}
            </Button>
            {composited && (
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="shrink-0 border-violet-300 text-violet-700 hover:bg-violet-50"
                title="Download PNG"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Layer pickers — hidden for now, can be re-enabled later ── */}
        {/* <div className="flex-1 space-y-4 min-w-0">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Customise layers
          </p>
          {layerGroups.map((group: NFTLayerGroup, gi: number) => (
            <div key={gi} className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-[10px] flex items-center justify-center font-bold shrink-0">
                  {gi + 1}
                </span>
                {group.name || `Layer ${gi + 1}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.variants.map((variantUrl, vi) => (
                  <button
                    key={vi}
                    onClick={() => handlePickVariant(gi, vi)}
                    className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95 ${
                      selections[gi] === vi
                        ? 'border-violet-500 shadow-md shadow-violet-200 dark:shadow-violet-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                    }`}
                    title={`Layer ${gi + 1}, variant ${vi + 1}`}
                  >
                    <img
                      src={variantUrl}
                      alt={`variant ${vi + 1}`}
                      className="w-full h-full object-contain p-0.5"
                      crossOrigin="anonymous"
                    />
                    {selections[gi] === vi && (
                      <div className="absolute inset-0 bg-violet-500/10 rounded-xl" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div> */}
      </div>

      {/* Full-size preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950 dark:to-purple-900 border-2 [&>button]:hidden">
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative w-full aspect-square">
            {composited ? (
              <img src={composited} alt={character.title} className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0">
                {currentUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ zIndex: i }}
                    crossOrigin="anonymous"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-background border-t flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{character.title}</p>
              <p className="text-xs text-muted-foreground">Right-click save or download</p>
            </div>
            <Button
              onClick={handleRandomise}
              disabled={isCompositing}
              size="sm"
              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-1.5 shrink-0"
            >
              <Shuffle className="h-3.5 w-3.5" />
              {isCompositing ? '…' : 'Randomise'}
            </Button>
            {composited && (
              <Button onClick={handleDownload} variant="outline" size="sm" className="gap-1.5 shrink-0">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main AvatarGeneratorCanvas ───────────────────────────────────────────────

export function AvatarGeneratorCanvas() {
  const { data: characters, isLoading } = useAvatarGeneratorNFTs();
  const [activeIdx, setActiveIdx] = useState(0);

  const activeChar = characters?.[activeIdx] ?? null;

  return (
    <div className="w-full space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <UserCircle2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-base leading-tight">Avatar Generator</h2>
          <p className="text-xs text-muted-foreground">Combine NFT layers to create your unique avatar</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-9 w-32 rounded-full" />)}
          </div>
          <div className="flex gap-6">
            <Skeleton className="w-64 h-64 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map(j => <Skeleton key={j} className="w-14 h-14 rounded-xl" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !characters || characters.length === 0 ? (
        <Card className="border-dashed border-violet-200 dark:border-violet-800">
          <CardContent className="py-12 text-center space-y-4">
            <Wand2 className="h-12 w-12 mx-auto text-violet-300" />
            <div className="space-y-1">
              <p className="font-medium text-sm">No characters available yet</p>
              <p className="text-xs text-muted-foreground">
                The admin hasn't selected any NFTs for the Avatar Generator yet.
              </p>
            </div>
            <RelaySelector className="max-w-xs mx-auto" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Character tabs */}
          {characters.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {characters.map((char, idx) => (
                <button
                  key={char.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    activeIdx === idx
                      ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-violet-300'
                  }`}
                >
                  {/* Mini thumbnail */}
                  <div className="relative w-5 h-5 rounded shrink-0 overflow-hidden">
                    {char.layerGroups.slice(0, 2).map((g, i) => (
                      <img
                        key={i}
                        src={g.variants[0]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ zIndex: i }}
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                  {char.title}
                </button>
              ))}
            </div>
          )}

          {/* Active character generator */}
          {activeChar && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border shadow-sm">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-violet-500" />
                {activeChar.title}
              </h3>
              <SingleCharacterGenerator key={activeChar.id} character={activeChar} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

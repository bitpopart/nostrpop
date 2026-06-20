import { useState, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNFTCharacters, type NFTCharacter, type NFTLayerGroup } from '@/hooks/useNFTCharacters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { ZapButton } from '@/components/ZapButton';
import { RelaySelector } from '@/components/RelaySelector';
import {
  Shuffle,
  Download,
  Bitcoin,
  Layers,
  Sparkles,
  ImageIcon,
  Images,
  Expand,
  X,
} from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

// ─── Canvas compositor ────────────────────────────────────────────────────────

async function compositeLayers(urls: string[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (urls.length === 0) return reject(new Error('No layers'));

    // Load all images first
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    urls.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        images[i] = img;
        loaded++;
        if (loaded === urls.length) {
          // Composite onto canvas
          const canvas = document.createElement('canvas');
          canvas.width = images[0].naturalWidth || 1024;
          canvas.height = images[0].naturalHeight || 1024;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context unavailable'));

          images.forEach(img => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          });

          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/png');
        }
      };
      img.onerror = () => reject(new Error(`Failed to load layer ${i}: ${url}`));
      img.src = url;
    });
  });
}

// ─── Pick one random variant URL per layer group ──────────────────────────────

function pickRandom(groups: NFTLayerGroup[]): string[] {
  return groups.map(g => {
    const valid = g.variants.filter(Boolean);
    if (valid.length === 0) return '';
    return valid[Math.floor(Math.random() * valid.length)];
  }).filter(Boolean);
}

// ─── Single character generator card ─────────────────────────────────────────

interface GeneratorCardProps {
  character: NFTCharacter;
}

function GeneratorCard({ character }: GeneratorCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [pickedUrls, setPickedUrls] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { layerGroups } = character;
  const totalVariants = layerGroups.reduce((sum, g) => sum + g.variants.length, 0);

  // Default preview: first variant of each group
  const defaultPreviewUrls = layerGroups.map(g => g.variants[0]).filter(Boolean);

  const handleGenerate = useCallback(async () => {
    if (layerGroups.length === 0) return;
    setIsGenerating(true);

    try {
      // Pick one random variant per layer group
      const picked = pickRandom(layerGroups);

      // Load all images
      const imgs = await Promise.all(
        picked.map(url =>
          new Promise<HTMLImageElement>((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = url;
          })
        )
      );

      // Composite onto canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, size, size);
      imgs.forEach(img => ctx.drawImage(img, 0, 0, size, size));

      setPickedUrls(picked);
      setGeneratedDataUrl(canvas.toDataURL('image/png'));
    } catch {
      // Fallback: show first variant of each group stacked
      const fallback = layerGroups.map(g => g.variants[0]).filter(Boolean);
      setPickedUrls(fallback);
      setGeneratedDataUrl(null);
    } finally {
      setIsGenerating(false);
    }
  }, [layerGroups]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (generatedDataUrl) {
        const a = document.createElement('a');
        a.href = generatedDataUrl;
        a.download = `${character.title.replace(/\s+/g, '-')}-NFT.png`;
        a.click();
      } else if (pickedUrls.length > 0) {
        const blob = await compositeLayers(pickedUrls);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.title.replace(/\s+/g, '-')}-NFT.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      if (pickedUrls[0]) window.open(pickedUrls[0], '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const hasGenerated = pickedUrls.length > 0;

  return (
    <>
    <Card className="overflow-hidden border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
      {/* Image area */}
      <div className="relative bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 aspect-square">
        {/* Hidden canvas for compositing */}
        <canvas ref={canvasRef} className="hidden" />

        {!hasGenerated ? (
          /* Default preview: stack first variant of each layer */
          <div className="absolute inset-0">
            {defaultPreviewUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                style={{ zIndex: i }}
                crossOrigin="anonymous"
              />
            ))}
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4" style={{ zIndex: 99 }}>
              <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                Press Generate ⚡
              </span>
            </div>
          </div>
        ) : generatedDataUrl ? (
          /* Canvas composite — clickable to open preview */
          <div
            className="absolute inset-0 cursor-zoom-in group"
            onClick={() => setPreviewOpen(true)}
          >
            <img
              src={generatedDataUrl}
              alt={`${character.title} NFT`}
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center" style={{ zIndex: 10 }}>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Expand className="h-3.5 w-3.5" />
                View full size
              </div>
            </div>
          </div>
        ) : (
          /* Fallback: stack picked urls — also clickable */
          <div
            className="absolute inset-0 cursor-zoom-in group"
            onClick={() => setPreviewOpen(true)}
          >
            {pickedUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                style={{ zIndex: i }}
                crossOrigin="anonymous"
              />
            ))}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center" style={{ zIndex: 10 }}>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Expand className="h-3.5 w-3.5" />
                View full size
              </div>
            </div>
          </div>
        )}

        {/* Category badge */}
        {character.category && (
          <Badge className="absolute top-2 left-2 z-10 bg-white/80 dark:bg-black/50 text-foreground text-xs border" variant="outline">
            {character.category}
          </Badge>
        )}

        {/* Stats badge */}
        <Badge className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 text-foreground text-xs border" variant="outline">
          <Layers className="h-2.5 w-2.5 mr-1" />
          {layerGroups.length}
          {totalVariants > layerGroups.length && (
            <><Images className="h-2.5 w-2.5 mx-1" />{totalVariants}</>
          )}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base">{character.title}</h3>
          <p className="text-xs text-muted-foreground">
            Nostr Fungible Token · Right-click save is fine 😄
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            size="sm"
          >
            {isGenerating ? (
              <span className="animate-pulse">Generating…</span>
            ) : (
              <>
                <Shuffle className="h-3.5 w-3.5 mr-1.5" />
                {hasGenerated ? 'Regenerate' : 'Generate NFT'}
              </>
            )}
          </Button>

          {hasGenerated && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="shrink-0"
              title="Download PNG"
            >
              {isDownloading
                ? <span className="text-xs animate-pulse">…</span>
                : <Download className="h-3.5 w-3.5" />
              }
            </Button>
          )}
        </div>

        {/* Zap */}
        <ZapButton
          authorPubkey={ADMIN_PUBKEY}
          lightningAddress="bitpopart@walletofsatoshi.com"
          event={character.event}
          eventTitle={`${character.title} NFT`}
          variant="outline"
          size="sm"
          alwaysShow
          className="w-full"
        />
      </CardContent>
    </Card>

    {/* ── Full-size preview popup ── */}
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/40 dark:to-pink-950/40 border-2">
        {/* Close button */}
        <button
          onClick={() => setPreviewOpen(false)}
          className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Big image */}
        <div className="relative w-full aspect-square">
          {generatedDataUrl ? (
            <img
              src={generatedDataUrl}
              alt={`${character.title} NFT`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0">
              {pickedUrls.map((url, i) => (
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

        {/* Actions bar */}
        <div className="p-4 bg-background/80 backdrop-blur border-t flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{character.title}</p>
            <p className="text-xs text-muted-foreground">Nostr Fungible Token · Right-click save is fine 😄</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => { setPreviewOpen(false); handleGenerate(); }}
              disabled={isGenerating}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white gap-1.5"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <ZapButton
              authorPubkey={ADMIN_PUBKEY}
              lightningAddress="bitpopart@walletofsatoshi.com"
              event={character.event}
              eventTitle={`${character.title} NFT`}
              variant="outline"
              size="sm"
              alwaysShow
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NFTPage() {
  useSeoMeta({
    title: 'Nostr Fungible Tokens – BitPopArt',
    description:
      'Generate your own BitPopArt cartoon NFT — Nostr Fungible Tokens. A fun gimmick to the old NFT space, now on Nostr. Right-click save is always free!',
    ogTitle: 'Nostr Fungible Tokens – BitPopArt',
    ogDescription:
      'Generate your own cartoon avatar. No blockchain, no gas fees — just Nostr and good vibes.',
  });

  const { data: characters, isLoading } = useNFTCharacters();

  // Get unique categories for tabs
  const categories = characters
    ? ['all', ...Array.from(new Set(characters.map(c => c.category).filter(Boolean)))]
    : ['all'];

  const [activeCategory, setActiveCategory] = useState('all');

  const filtered =
    activeCategory === 'all'
      ? (characters ?? [])
      : (characters ?? []).filter(c => c.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-pink-50 dark:from-orange-950/20 dark:via-background dark:to-pink-950/20">

      {/* ── Header ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-2xl" />
          <div className="absolute top-20 right-20 w-48 h-48 bg-pink-200/30 dark:bg-pink-800/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-12 pb-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center">
              <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-sm px-3 py-1">
                <Bitcoin className="h-3.5 w-3.5 mr-1.5" />
                100% On-Chain Free · Nostr Only
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Nostr Fungible
              </span>
              <br />
              <span className="text-foreground">Tokens</span>
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-xl mx-auto">
              Generate your own cartoon character &amp; download it instantly.
              No blockchain. No gas fees. Just vibes.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-8 space-y-12">

        {/* ── Choose & Generate ── */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black mb-2">
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Choose &amp; Generate
              </span>
            </h2>
            <p className="text-muted-foreground">Each generate picks a random variant per layer — every result is unique</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
              ))}
            </div>
          ) : !characters || characters.length === 0 ? (
            <div className="max-w-sm mx-auto">
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center space-y-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">
                    No characters available yet. Check back soon!
                  </p>
                  <RelaySelector className="w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {categories.length > 2 && (
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
                  <TabsList className="mx-auto flex">
                    {categories.map(cat => (
                      <TabsTrigger key={cat} value={cat} className="capitalize">
                        {cat === 'all' ? 'All Characters' : cat}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {categories.map(cat => (
                    <TabsContent key={cat} value={cat} />
                  ))}
                </Tabs>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(char => (
                  <GeneratorCard key={char.id} character={char} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── The Story ── */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Bitcoin className="h-5 w-5 text-orange-500" />
                <span className="font-bold text-orange-700 dark:text-orange-400 text-sm uppercase tracking-wider">The Story</span>
              </div>
              <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
                <p>
                  In 2023 when I started on Nostr I came out of the so-called shitcoin space. And yes — I made NFTs. 😅
                </p>
                <p>
                  But now, already many years <span className="font-semibold text-foreground">'clean'</span> lol, and only focused on{' '}
                  <span className="font-bold text-orange-600 dark:text-orange-400">Bitcoin</span> (as money) and{' '}
                  <span className="font-bold text-purple-600 dark:text-purple-400">Nostr</span> (as media) —
                  I share here the <strong>Nostr Fungible Tokens</strong>.
                </p>
                <p>
                  As a gimmick to the NFT space. No NFTs for me anymore on a blockchain, only on Nostr.
                </p>
                <p className="text-foreground font-medium">
                  So enjoy and feel free to right-click save! 😄
                </p>
                <p className="text-sm">
                  A zap is always appreciated if you feel this NFT has any value ⚡
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Footer Zap ── */}
        <div className="max-w-xl mx-auto text-center space-y-4 py-4">
          <h3 className="text-xl font-bold">Love a character? Send a zap! ⚡</h3>
          <p className="text-muted-foreground text-sm">
            Every zap goes directly to <strong>bitpopart@walletofsatoshi.com</strong> via Lightning.
          </p>
          <ZapButton
            authorPubkey={ADMIN_PUBKEY}
            lightningAddress="bitpopart@walletofsatoshi.com"
            eventTitle="BitPopArt NFT Collection"
            variant="default"
            size="lg"
            alwaysShow
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
          />
        </div>
      </div>

      {/* ── Big statement ── */}
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
          <span className="text-foreground">Don't buy NFTs,</span>
          <br />
          <span className="text-foreground">Don't do Shitcoins!</span>
          <br />
          <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
            Study Bitcoin.
          </span>
        </p>
      </div>

      <div className="text-center pb-8 text-xs text-muted-foreground/60">
        Nostr Fungible Tokens · No blockchain · No gas fees · Just Nostr
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNFTCharacters, type NFTCharacter } from '@/hooks/useNFTCharacters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { ZapButton } from '@/components/ZapButton';
import { RelaySelector } from '@/components/RelaySelector';
import {
  Shuffle,
  Download,
  Bitcoin,
  Layers,
  ArrowRight,
  Sparkles,
  ImageIcon,
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

// ─── Single character generator card ─────────────────────────────────────────

interface GeneratorCardProps {
  character: NFTCharacter;
}

function GeneratorCard({ character }: GeneratorCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);

  const { layers } = character;

  const handleGenerate = useCallback(async () => {
    if (layers.length === 0) return;
    setIsGenerating(true);

    try {
      // For each layer randomly pick a variant — here each layer has one image
      // but we support random selection if the same layer label has multiple entries
      const picked = layers.map(l => l.url);

      // Draw onto canvas for preview
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Load images
      const imgs = await Promise.all(
        picked.map(url => {
          return new Promise<HTMLImageElement>((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = url;
          });
        })
      );

      const size = 800;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, size, size);
      imgs.forEach(img => ctx.drawImage(img, 0, 0, size, size));

      setSelectedLayers(picked);
      setGenerated(true);
    } catch {
      // fallback: just show stacked images
      setSelectedLayers(layers.map(l => l.url));
      setGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  }, [layers]);

  const handleDownload = async () => {
    if (!generated) return;
    setIsDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${character.title.replace(/\s+/g, '-')}-NFT.png`;
        a.click();
      }
    } catch {
      // fallback: fetch + blob
      try {
        const blob = await compositeLayers(selectedLayers);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.title.replace(/\s+/g, '-')}-NFT.png`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // last resort
        window.open(selectedLayers[0], '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
      {/* Image area */}
      <div className="relative bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 aspect-square">
        {/* Hidden canvas used for compositing */}
        <canvas ref={canvasRef} className="hidden" />

        {!generated ? (
          /* Default stacked preview */
          <div className="absolute inset-0">
            {layers.map((layer, i) => (
              <img
                key={i}
                src={layer.url}
                alt={layer.label}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ zIndex: i }}
                crossOrigin="anonymous"
              />
            ))}
            {/* Overlay prompt */}
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4" style={{ zIndex: 99 }}>
              <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                Press Generate ⚡
              </span>
            </div>
          </div>
        ) : (
          /* Generated canvas preview */
          <img
            src={canvasRef.current?.toDataURL('image/png') || ''}
            alt={`${character.title} NFT`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* Category badge */}
        {character.category && (
          <Badge
            className="absolute top-2 left-2 z-10 bg-white/80 dark:bg-black/50 text-foreground text-xs border"
            variant="outline"
          >
            {character.category}
          </Badge>
        )}

        {/* Layer count badge */}
        <Badge
          className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 text-foreground text-xs border"
          variant="outline"
        >
          <Layers className="h-2.5 w-2.5 mr-1" />
          {layers.length} layers
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base">{character.title}</h3>
          <p className="text-xs text-muted-foreground">Nostr Fungible Token · Right-click save is fine 😄</p>
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
                Generate NFT
              </>
            )}
          </Button>

          {generated && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {isDownloading ? (
                <span className="text-xs animate-pulse">…</span>
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Zap */}
        <ZapButton
          authorPubkey={ADMIN_PUBKEY}
          lightningAddress="traveltelly@primal.net"
          event={character.event}
          eventTitle={`${character.title} NFT`}
          variant="outline"
          size="sm"
          alwaysShow
          className="w-full"
        />
      </CardContent>
    </Card>
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
      {/* ── Hero / Intro ── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-2xl" />
          <div className="absolute top-20 right-20 w-48 h-48 bg-pink-200/30 dark:bg-pink-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-32 bg-yellow-200/20 dark:bg-yellow-800/10 rounded-full blur-2xl" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-sm px-3 py-1">
                <Bitcoin className="h-3.5 w-3.5 mr-1.5" />
                100% On-Chain Free · Nostr Only
              </Badge>
            </div>

            {/* Title */}
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

            {/* CTA */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href="#generator">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white gap-2 text-base px-8">
                  <Sparkles className="h-4 w-4" />
                  Start Generating
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Story ── */}
      <section className="container mx-auto px-4 py-12">
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
      </section>

      {/* ── How it works ── */}
      <section className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-6">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: '🎨',
                title: 'Pick a Character',
                desc: 'Choose from the BitPopArt cartoon characters below.',
              },
              {
                icon: '⚡',
                title: 'Generate',
                desc: 'Hit Generate — the character layers are combined into a unique image.',
              },
              {
                icon: '📥',
                title: 'Download & Share',
                desc: 'Download your PNG. Right-click save is always free. Zap if you love it!',
              },
            ].map((step, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white dark:bg-card border">
                <div className="text-3xl mb-2">{step.icon}</div>
                <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Generator ── */}
      <section id="generator" className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Choose &amp; Generate
            </span>
          </h2>
          <p className="text-muted-foreground">Select a character and generate your unique NFT</p>
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
          <div className="col-span-full max-w-sm mx-auto">
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
            {/* Category tabs */}
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
      </section>

      {/* ── Footer CTA ── */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <h3 className="text-xl font-bold">Love a character? Send a zap! ⚡</h3>
          <p className="text-muted-foreground text-sm">
            Every zap goes directly to <strong>traveltelly@primal.net</strong> via Lightning.
            It helps Johannes keep creating more pop-art characters on Nostr.
          </p>
          <ZapButton
            authorPubkey={ADMIN_PUBKEY}
            lightningAddress="traveltelly@primal.net"
            eventTitle="BitPopArt NFT Collection"
            variant="default"
            size="lg"
            alwaysShow
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
          />
        </div>
      </section>

      {/* ── Footer note ── */}
      <div className="text-center pb-8 text-xs text-muted-foreground/60">
        Nostr Fungible Tokens · No blockchain · No gas fees · Just Nostr
      </div>
    </div>
  );
}

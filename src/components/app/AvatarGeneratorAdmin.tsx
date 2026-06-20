/**
 * AvatarGeneratorAdmin
 *
 * Shown inside the Avatars admin section (AvatarsAdmin) as a second tab.
 * The admin picks which NFT characters (from /NFT-admin) should appear
 * in the Studio Avatar Generator.
 *
 * Selections are saved as a kind-34019 addressable event.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNFTCharacters, type NFTCharacter } from '@/hooks/useNFTCharacters';
import { useAvatarGeneratorConfig, useSaveAvatarGeneratorConfig } from '@/hooks/useAvatarGenerator';
import {
  Wand2,
  CheckCircle2,
  Circle,
  Layers,
  Images,
  Save,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── NFT character card with select toggle ────────────────────────────────────

interface NFTSelectCardProps {
  character: NFTCharacter;
  selected: boolean;
  onToggle: () => void;
}

function NFTSelectCard({ character, selected, onToggle }: NFTSelectCardProps) {
  const previewUrls = character.layerGroups.map(g => g.variants[0]).filter(Boolean);
  const totalVariants = character.layerGroups.reduce((s, g) => s + g.variants.length, 0);

  return (
    <div
      onClick={onToggle}
      className={`relative group rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        selected
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'
      }`}
    >
      {/* Preview image */}
      <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30">
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

        {/* Selection indicator overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all ${
            selected ? 'bg-violet-500/20' : 'bg-transparent group-hover:bg-violet-500/10'
          }`}
        >
          <div className={`absolute top-2 right-2 z-10 ${selected ? 'text-violet-600' : 'text-gray-300 group-hover:text-violet-400'}`}>
            {selected
              ? <CheckCircle2 className="h-6 w-6 drop-shadow-md" />
              : <Circle className="h-6 w-6" />
            }
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="font-semibold text-xs truncate">{character.title}</p>
        <div className="flex gap-1 flex-wrap">
          {character.category && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{character.category}</Badge>
          )}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Layers className="h-2.5 w-2.5 mr-0.5" />{character.layerGroups.length}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Images className="h-2.5 w-2.5 mr-0.5" />{totalVariants}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AvatarGeneratorAdmin() {
  const navigate = useNavigate();

  const { data: allCharacters = [], isLoading: charsLoading, refetch, isFetching } = useNFTCharacters();
  const { data: savedIds = [], isLoading: configLoading } = useAvatarGeneratorConfig();
  const { mutate: saveConfig, isPending: isSaving } = useSaveAvatarGeneratorConfig();

  // Local selection state (initialised from saved config once loaded)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (!configLoading && !initialised) {
      setSelectedIds(savedIds);
      setInitialised(true);
    }
  }, [configLoading, savedIds, initialised]);

  const toggleCharacter = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    saveConfig(selectedIds);
  };

  const hasChanges =
    JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...savedIds].sort());

  const isLoading = charsLoading || configLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-violet-600" />
          Avatar Generator — NFT Selection
        </CardTitle>
        <CardDescription>
          Pick the NFT characters that will appear in the Studio Avatar Generator.
          Users can combine the layers of these characters to build their own avatar.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedIds.length} of {allCharacters.length} characters selected</span>
            {hasChanges && (
              <Badge variant="outline" className="border-amber-400 text-amber-600 text-xs">Unsaved changes</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => refetch()} disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => navigate('/NFT-admin')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage NFTs
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : <><Save className="h-3.5 w-3.5" /> Save Selection</>
              }
            </Button>
          </div>
        </div>

        {/* Character grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : allCharacters.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Wand2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No NFT characters found.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/NFT-admin')} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Create NFT characters first
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allCharacters.map(char => (
              <NFTSelectCard
                key={char.id}
                character={char}
                selected={selectedIds.includes(char.id)}
                onToggle={() => toggleCharacter(char.id)}
              />
            ))}
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          Selected characters will appear as options in the <strong>Studio → Avatar Generator</strong> tab.
          The layers and variants from each NFT character are reused directly — no new images needed.
        </p>
      </CardContent>
    </Card>
  );
}

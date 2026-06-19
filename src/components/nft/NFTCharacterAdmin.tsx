import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNFTCharacters } from '@/hooks/useNFTCharacters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { ImageIcon, Layers, ExternalLink, Plus, Images, Shuffle } from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

export function NFTCharacterAdmin() {
  const navigate = useNavigate();
  const { data: characters, isLoading } = useNFTCharacters();

  const totalVariants = characters?.reduce(
    (sum, c) => sum + c.layerGroups.reduce((s, g) => s + g.variants.length, 0),
    0
  ) ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-orange-500" />
                NFT Characters (Nostr Fungible Tokens)
              </CardTitle>
              <CardDescription>
                Layered cartoon characters with random variants per layer. Manage them in the dedicated NFT Admin.
              </CardDescription>
            </div>
            <Button
              onClick={() => navigate('/nft-admin')}
              className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open NFT Admin
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats row */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span><strong className="text-foreground">{characters?.length ?? 0}</strong> characters</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Images className="h-4 w-4" />
              <span><strong className="text-foreground">{totalVariants}</strong> total variants</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shuffle className="h-4 w-4" />
              <span>Random per layer on generate</span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {characters.map(char => {
                const previewUrls = char.layerGroups.map(g => g.variants[0]).filter(Boolean);
                const variantCount = char.layerGroups.reduce((s, g) => s + g.variants.length, 0);
                return (
                  <div
                    key={char.id}
                    className="group relative border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate('/nft-admin')}
                  >
                    <div className="aspect-square relative bg-muted/30">
                      {previewUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                          style={{ zIndex: i }}
                        />
                      ))}
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="font-medium text-sm truncate">{char.title}</p>
                      <div className="flex gap-1 flex-wrap">
                        {char.category && (
                          <Badge variant="secondary" className="text-xs">{char.category}</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <Layers className="h-2.5 w-2.5 mr-1" />
                          {char.layerGroups.length}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Images className="h-2.5 w-2.5 mr-1" />
                          {variantCount}
                        </Badge>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">Edit →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-4">No characters yet.</p>
              <Button
                onClick={() => navigate('/nft-admin')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Character
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

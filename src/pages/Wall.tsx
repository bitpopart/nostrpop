import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { LoginArea } from '@/components/auth/LoginArea';
import { Link } from 'react-router-dom';
import { Shield, Plus, Sparkles } from 'lucide-react';

interface StreetArtPhoto {
  id: string;
  imageUrl: string;
  description?: string;
  created_at: string;
  eventId: string;
}

export default function Wall() {
  const { nostr } = useNostr();
  const isAdmin = useIsAdmin();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useSeoMeta({
    title: 'Wall - Street Art Gallery',
    description: 'Art belongs to the streets - A gallery of street art photos from around the world',
  });

  // Query street art photos from Nostr
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['street-art-photos'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for kind 1 notes with #streetart tag
      const events = await nostr.query(
        [
          {
            kinds: [1],
            '#t': ['streetart'],
            limit: 100,
          },
        ],
        { signal }
      );

      console.log(`Found ${events.length} street art posts`);

      // Extract images from events
      const streetArtPhotos: StreetArtPhoto[] = [];

      events.forEach((event) => {
        // Find image URLs in content (look for http links ending in image extensions)
        const imageRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp)/gi;
        const matches = event.content.match(imageRegex);

        if (matches && matches.length > 0) {
          // Add each image as a separate photo
          matches.forEach((imageUrl) => {
            streetArtPhotos.push({
              id: `${event.id}-${imageUrl}`,
              imageUrl,
              description: event.content.replace(imageRegex, '').trim(),
              created_at: new Date(event.created_at * 1000).toISOString(),
              eventId: event.id,
            });
          });
        }
      });

      // Sort by creation date (newest first)
      return streetArtPhotos.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Graffiti-style background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}/>
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Spray Paint Icon */}
            <div className="flex justify-center mb-6">
              <img
                src="/spray_paint_icon.svg"
                alt="Spray Paint"
                className="h-20 w-20 filter brightness-0 invert"
              />
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
                WALL
              </span>
            </h1>

            <p className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-wide">
              Art belongs to the streets
            </p>

            <p className="text-lg text-gray-400 mb-8">
              A gallery of street art photos from around the world
            </p>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                >
                  <Link to="/admin" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Manage in Admin</span>
                  </Link>
                </Button>
                <p className="text-sm text-gray-400">
                  Post photos with #streetart on Nostr to add them here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-700 bg-gray-800/50">
            <CardContent className="py-16 px-8 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="flex justify-center">
                  <img
                    src="/spray_paint_icon.svg"
                    alt="Spray Paint"
                    className="h-16 w-16 filter brightness-0 invert opacity-30"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">No Street Art Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Be the first to share street art! Post photos on Nostr with the #streetart tag.
                  </p>
                  {!isAdmin && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Login to start posting</p>
                      <LoginArea className="max-w-60 mx-auto" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Photo Count */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <p className="text-white font-semibold">
                  {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                </p>
              </div>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10"
                  onClick={() => setSelectedImage(photo.imageUrl)}
                >
                  <div className="aspect-square bg-gray-800">
                    <img
                      src={photo.imageUrl}
                      alt={photo.description || 'Street art'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Overlay with description on hover */}
                  {photo.description && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-white text-sm line-clamp-3">
                        {photo.description}
                      </p>
                    </div>
                  )}

                  {/* Graffiti-style border effect */}
                  <div className="absolute inset-0 border-4 border-transparent group-hover:border-orange-500/50 transition-all duration-300 rounded-lg pointer-events-none" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={selectedImage}
              alt="Street art"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="lg"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <img
            src="/spray_paint_icon.svg"
            alt="Spray Paint"
            className="h-12 w-12 filter brightness-0 invert opacity-30 mx-auto"
          />
          <p className="text-gray-500 text-sm">
            Share your street art photos on Nostr with #streetart
          </p>
        </div>
      </div>
    </div>
  );
}

import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppMedia } from '@/hooks/useAppContent';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Download, Image as ImageIcon, ArrowLeft, X } from 'lucide-react';
import { RelaySelector } from '@/components/RelaySelector';

function handleDownload(url: string, filename: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(() => window.open(url, '_blank'));
}

function deriveFilename(url: string, title: string): string {
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `wallpaper.${ext}`;
}

export default function Wallpapers() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: wallpapers = [], isLoading } = useAppMedia('app-wallpaper');
  const [lightbox, setLightbox] = useState<string | null>(null);

  useSeoMeta({
    title: 'Wallpapers - BitPopArt',
    description: 'Download free Bitcoin PopArt wallpapers by BitPopArt',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/app')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ImageIcon className="h-10 w-10 text-teal-600" />
            <h1 className="text-4xl font-bold gradient-header-text">Wallpapers</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Bitcoin PopArt wallpapers by BitPopArt — free to download and use!
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : wallpapers.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">No wallpapers found. Try another relay?</p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {wallpapers.length} wallpaper{wallpapers.length !== 1 ? 's' : ''} available
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wallpapers.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setLightbox(item.image_url)}
                >
                  <div className="aspect-square">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  {/* Download button */}
                  <Button
                    size="icon"
                    className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={getGradientStyle('primary')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item.image_url, deriveFilename(item.image_url, item.title));
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {/* Title overlay */}
                  {item.title !== 'Untitled' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium truncate">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-16 text-xs text-muted-foreground">
          <p>BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {lightbox && (
            <div className="relative">
              <img src={lightbox} alt="Wallpaper" className="w-full h-auto" />
              <Button
                size="icon"
                className="absolute top-2 right-2 rounded-full text-white border-0"
                style={getGradientStyle('primary')}
                onClick={() => handleDownload(lightbox, lightbox.split('/').pop() || 'wallpaper.jpg')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

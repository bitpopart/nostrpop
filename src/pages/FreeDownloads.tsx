import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RelaySelector } from '@/components/RelaySelector';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  useFreeDownloads,
  useCreateFreeDownload,
  useDeleteFreeDownload,
} from '@/hooks/useFreeDownloads';
import {
  Download,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Gift,
  X,
} from 'lucide-react';

export default function FreeDownloads() {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();
  const { data: downloads = [], isLoading } = useFreeDownloads();
  const { mutate: createDownload, isPending: isPublishing } = useCreateFreeDownload();
  const { mutate: deleteDownload } = useDeleteFreeDownload();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useSeoMeta({
    title: 'Free Downloads - BitPopArt',
    description: 'Free images and art downloads by BitPopArt. Download and use them however you like!',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const tags = await uploadFile(files[0]);
      const url = tags[0][1];
      setImageUrl(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = () => {
    if (!imageUrl) return;
    createDownload(
      { title: title || 'Free Download', imageUrl },
      {
        onSuccess: () => {
          setTitle('');
          setImageUrl('');
          setShowUploadForm(false);
        },
      },
    );
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'bitpopart-free-download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-cyan-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4 gap-3">
            <Gift className="h-12 w-12 text-teal-600" />
            <h1 className="text-5xl font-bold leading-tight gradient-header-text">
              Free Downloads
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Free images and art by BitPopArt — download and use them however you like!
          </p>
        </div>

        {/* Admin Upload Section */}
        {user && isAdmin && (
          <div className="max-w-2xl mx-auto mb-10">
            {!showUploadForm ? (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="w-full text-white border-0"
                style={getGradientStyle('primary')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Free Download Image
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Image
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setShowUploadForm(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dl-title">Title (optional)</Label>
                    <Input
                      id="dl-title"
                      placeholder="e.g. Bitcoin Pop Art Wallpaper"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Image</Label>
                    {imageUrl ? (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full max-h-64 object-contain rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => setImageUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload an image
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>

                  <Button
                    onClick={handlePublish}
                    disabled={!imageUrl || isPublishing}
                    className="w-full text-white border-0"
                    style={getGradientStyle('primary')}
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Publish
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="aspect-square w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && downloads.length === 0 && (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <Gift className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-muted-foreground">
                  No free downloads yet. Check back soon or try a different relay.
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Grid */}
        {downloads.length > 0 && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              {downloads.length} image{downloads.length !== 1 ? 's' : ''} available
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {downloads.map((dl) => {
                // Derive a filename from the URL
                const urlParts = dl.image_url.split('/');
                const rawFilename = urlParts[urlParts.length - 1] || 'download';
                const filename = dl.title !== 'Untitled'
                  ? `${dl.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${rawFilename.split('.').pop() || 'jpg'}`
                  : rawFilename;

                return (
                  <div
                    key={dl.id}
                    className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image */}
                    <div
                      className="aspect-square cursor-pointer"
                      onClick={() => setLightboxImage(dl.image_url)}
                    >
                      <img
                        src={dl.image_url}
                        alt={dl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>

                    {/* Download button (top-right corner) */}
                    <Button
                      size="icon"
                      className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white border-0"
                      style={getGradientStyle('primary')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(dl.image_url, filename);
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {/* Admin delete button */}
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 left-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDownload(dl.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}

                    {/* Title overlay */}
                    {dl.title !== 'Untitled' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-white text-sm font-medium truncate">{dl.title}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Full size"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

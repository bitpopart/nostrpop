import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RelaySelector } from '@/components/RelaySelector';
import { ZapButton } from '@/components/ZapButton';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
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
  CheckCircle2,
  Heart,
} from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

interface PendingImage {
  id: string;          // local key
  file: File;
  previewUrl: string;  // object URL for preview
  title: string;
  uploadedUrl: string | null;  // set after upload
  uploading: boolean;
  error: boolean;
}

export default function FreeDownloads() {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();
  const { data: downloads = [], isLoading } = useFreeDownloads();
  const { mutate: createDownload, isPending: isPublishing } = useCreateFreeDownload();
  const { mutate: deleteDownload } = useDeleteFreeDownload();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSeoMeta({
    title: 'Free Downloads - BitPopArt',
    description: 'Free images and art downloads by BitPopArt. Download and use them however you like!',
  });

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Add all files to pending list immediately (with previews)
    const newPending: PendingImage[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title: '',
      uploadedUrl: null,
      uploading: true,
      error: false,
    }));

    setPendingImages(prev => [...prev, ...newPending]);

    // Reset input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Upload all files in parallel
    await Promise.all(newPending.map(async (pending) => {
      try {
        const tags = await uploadFile(pending.file);
        const url = tags[0][1];
        setPendingImages(prev =>
          prev.map(p => p.id === pending.id ? { ...p, uploadedUrl: url, uploading: false } : p)
        );
      } catch {
        setPendingImages(prev =>
          prev.map(p => p.id === pending.id ? { ...p, uploading: false, error: true } : p)
        );
      }
    }));
  };

  const updateTitle = (id: string, title: string) => {
    setPendingImages(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  };

  const removePending = (id: string) => {
    setPendingImages(prev => {
      const item = prev.find(p => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const handlePublishAll = async () => {
    const ready = pendingImages.filter(p => p.uploadedUrl && !p.uploading && !p.error);
    if (ready.length === 0) return;

    setIsSubmitting(true);
    let published = 0;

    // Publish sequentially to avoid relay flooding
    for (const item of ready) {
      await new Promise<void>((resolve) => {
        createDownload(
          { title: item.title.trim() || 'Free Download', imageUrl: item.uploadedUrl! },
          {
            onSuccess: () => { published++; resolve(); },
            onError: () => resolve(),
          }
        );
      });
    }

    // Clean up previews
    pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
    setIsSubmitting(false);
    if (published > 0) setShowUploadForm(false);
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
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-3">
            Free images and art by BitPopArt — download and use them however you like!
          </p>
          {/* Slogan */}
          <p className="text-lg font-semibold text-teal-700 dark:text-teal-400 italic mb-6">
            Digital art is free — feel free to zap ⚡
          </p>
          {/* Zap + Community buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <ZapButton
              authorPubkey={ADMIN_PUBKEY}
              lightningAddress="traveltelly@primal.net"
              eventTitle="BitPopArt Free Downloads"
              size="lg"
              variant="outline"
              showLabel={true}
              className="h-14 px-10 text-lg font-bold border-2 border-orange-400 hover:border-orange-500"
            />
            <Link to="/app">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-bold gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 text-white border-0 shadow-md"
              >
                <Heart className="h-5 w-5 fill-white" />
                Join the POP Community
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Upload Section */}
        {user && isAdmin && (
          <div className="max-w-4xl mx-auto mb-10">
            {!showUploadForm ? (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="w-full text-white border-0"
                style={getGradientStyle('primary')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Free Download Images
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Images
                      {pendingImages.length > 0 && (
                        <Badge variant="secondary">{pendingImages.length} selected</Badge>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl));
                        setPendingImages([]);
                        setShowUploadForm(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Drop zone */}
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-teal-300 dark:border-teal-700">
                    <ImageIcon className="h-8 w-8 text-teal-500 mb-2" />
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
                      Click to select images
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Select multiple files at once — all will upload in parallel
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                    />
                  </label>

                  {/* Pending images grid */}
                  {pendingImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {pendingImages.map(item => (
                        <div key={item.id} className="relative rounded-xl overflow-hidden border bg-white dark:bg-gray-800 shadow-sm">
                          {/* Preview */}
                          <div className="aspect-square relative">
                            <img
                              src={item.previewUrl}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                            {/* Upload status overlay */}
                            {item.uploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                              </div>
                            )}
                            {item.error && (
                              <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                                <span className="text-white text-xs font-medium px-2 text-center">Upload failed</span>
                              </div>
                            )}
                            {item.uploadedUrl && (
                              <div className="absolute top-2 left-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" />
                              </div>
                            )}
                            {/* Remove button */}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full"
                              onClick={() => removePending(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          {/* Title input */}
                          <div className="p-2">
                            <Input
                              placeholder="Title (optional)"
                              value={item.title}
                              onChange={(e) => updateTitle(item.id, e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Publish all button */}
                  {pendingImages.length > 0 && (
                    <Button
                      onClick={handlePublishAll}
                      disabled={
                        isSubmitting ||
                        isPublishing ||
                        pendingImages.every(p => p.uploading || p.error)
                      }
                      className="w-full text-white border-0"
                      style={getGradientStyle('primary')}
                    >
                      {isSubmitting || isPublishing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Publish {pendingImages.filter(p => p.uploadedUrl).length} Image{pendingImages.filter(p => p.uploadedUrl).length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  )}

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

                    {/* Non-admin: Zap (top-left) + Download (top-right) — always visible */}
                    {!isAdmin && (
                      <>
                        {/* Zap button — top-left */}
                        <div
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ZapButton
                            authorPubkey={ADMIN_PUBKEY}
                            lightningAddress="traveltelly@primal.net"
                            event={dl.event}
                            eventTitle={dl.title}
                            size="icon"
                            variant="default"
                            showLabel={false}
                            className="h-9 w-9 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600 text-white border-0"
                          />
                        </div>

                        {/* Download button — top-right */}
                        <Button
                          size="icon"
                          className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg text-white border-0 z-10"
                          style={getGradientStyle('primary')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(dl.image_url, filename);
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Admin controls — delete top-left, download top-right (hover only) */}
                    {isAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 left-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDownload(dl.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white border-0 z-10"
                          style={getGradientStyle('primary')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(dl.image_url, filename);
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
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

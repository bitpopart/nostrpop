import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, SlidersHorizontal } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface CarouselAdminProps {
  onBack: () => void;
}

export function CarouselAdmin({ onBack }: CarouselAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-orange-600" />
            Home Carousel Images
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
              <ImageIcon className="h-3 w-3" /> /app Frontpage
            </span>
          </CardTitle>
          <CardDescription>
            Upload the images shown in the sliding carousel at the top of the <strong>/app</strong> frontpage.
            When carousel images are set here, only these images will be shown. If no images are uploaded, the
            carousel automatically falls back to a mix of wallpapers, GIFs, avatars and free downloads.
            <br />
            <span className="text-xs text-muted-foreground block mt-1">
              Any image size is supported — the carousel adapts to the natural dimensions of each uploaded image. Upload up to 20 images.
              Drag to reorder is not yet supported — images are shown newest-first.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-carousel" label="Carousel Image" />
          <MediaList type="app-carousel" aspectClass="aspect-natural" />
        </CardContent>
      </Card>
    </div>
  );
}

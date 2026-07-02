import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface CarouselAdminProps {
  onBack: () => void;
}

export function CarouselAdmin({ onBack }: CarouselAdminProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      {/* App / Home Carousel */}
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

      {/* Shop Carousel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-pink-600" />
            Shop Carousel Images
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700">
              <ImageIcon className="h-3 w-3" /> /shop Page
            </span>
          </CardTitle>
          <CardDescription>
            Upload the images shown in the sliding carousel at the top of the <strong>/shop</strong> page.
            These are independent from the /app carousel — upload your best product images, promotions, or
            art showcases here. Images adapt to their natural dimensions just like the /app carousel.
            <br />
            <span className="text-xs text-muted-foreground block mt-1">
              Any image size is supported. Upload up to 20 images. Images are shown newest-first.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="shop-carousel" label="Shop Carousel Image" />
          <MediaList type="shop-carousel" aspectClass="aspect-natural" />
        </CardContent>
      </Card>
    </div>
  );
}

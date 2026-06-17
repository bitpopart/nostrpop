import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, Smartphone } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface WallpapersAdminProps {
  onBack: () => void;
}

export function WallpapersAdmin({ onBack }: WallpapersAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-teal-600" />
            Wallpapers
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
              <Smartphone className="h-3 w-3" /> Mobile
            </span>
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete mobile wallpapers. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-wallpaper" label="Wallpaper" />
          <MediaList type="app-wallpaper" />
        </CardContent>
      </Card>
    </div>
  );
}

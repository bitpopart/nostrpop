import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface DesktopWallpapersAdminProps {
  onBack: () => void;
}

export function DesktopWallpapersAdmin({ onBack }: DesktopWallpapersAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-indigo-600" />
            Desktop Wallpapers
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete desktop / PC wallpapers. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-desktop-wallpaper" label="Desktop Wallpaper" />
          <MediaList type="app-desktop-wallpaper" aspectClass="aspect-video" />
        </CardContent>
      </Card>
    </div>
  );
}

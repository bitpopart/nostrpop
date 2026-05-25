import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
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
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete wallpapers. Hover any item to edit or delete it.
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

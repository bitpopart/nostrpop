import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface ColoringPagesAdminProps {
  onBack: () => void;
}

export function ColoringPagesAdmin({ onBack }: ColoringPagesAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-rose-600" />
            Coloring Pages
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete coloring pages. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-coloring-page" label="Coloring Page" />
          <MediaList type="app-coloring-page" />
        </CardContent>
      </Card>
    </div>
  );
}

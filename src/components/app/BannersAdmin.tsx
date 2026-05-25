import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PanelTop } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface BannersAdminProps {
  onBack: () => void;
}

export function BannersAdmin({ onBack }: BannersAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelTop className="h-5 w-5 text-sky-600" />
            Header Banners
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete header banners. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-banner" label="Banner" />
          <MediaList type="app-banner" aspectClass="aspect-video" />
        </CardContent>
      </Card>
    </div>
  );
}

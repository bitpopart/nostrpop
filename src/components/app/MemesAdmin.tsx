import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Laugh } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface MemesAdminProps {
  onBack: () => void;
}

export function MemesAdmin({ onBack }: MemesAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Laugh className="h-5 w-5 text-yellow-600" />
            Memes
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete memes. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-meme" label="Meme" />
          <MediaList type="app-meme" />
        </CardContent>
      </Card>
    </div>
  );
}

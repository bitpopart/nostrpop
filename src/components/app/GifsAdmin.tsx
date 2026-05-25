import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';

interface GifsAdminProps {
  onBack: () => void;
}

export function GifsAdmin({ onBack }: GifsAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-amber-600" />
            Animated GIFs
          </CardTitle>
          <CardDescription>
            Upload, edit title &amp; hashtags, and delete animated GIFs. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-gif" label="GIF" />
          <MediaList type="app-gif" />
        </CardContent>
      </Card>
    </div>
  );
}

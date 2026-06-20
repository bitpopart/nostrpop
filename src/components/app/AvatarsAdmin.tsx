import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserCircle2, Wand2 } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';
import { AvatarGeneratorAdmin } from './AvatarGeneratorAdmin';

interface AvatarsAdminProps {
  onBack: () => void;
}

export function AvatarsAdmin({ onBack }: AvatarsAdminProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Tabs defaultValue="avatars">
        <TabsList className="mb-4">
          <TabsTrigger value="avatars" className="gap-1.5">
            <UserCircle2 className="h-4 w-4" />
            Avatars
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-1.5">
            <Wand2 className="h-4 w-4" />
            Avatar Generator
          </TabsTrigger>
        </TabsList>

        {/* ── Upload & manage avatars ── */}
        <TabsContent value="avatars">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2 className="h-5 w-5 text-violet-600" />
                Avatars
              </CardTitle>
              <CardDescription>
                Upload, edit title &amp; hashtags, and delete profile avatars. Hover any item to edit or delete it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader type="app-avatar" label="Avatar" />
              <MediaList type="app-avatar" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Avatar Generator config ── */}
        <TabsContent value="generator">
          <AvatarGeneratorAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Laugh, LayoutTemplate, Shapes } from 'lucide-react';
import { MediaUploader, MediaList } from './AppContentManagement';
import { useAppMedia } from '@/hooks/useAppContent';

interface MemesAdminProps {
  onBack: () => void;
}

export function MemesAdmin({ onBack }: MemesAdminProps) {
  const { data: memes = [] } = useAppMedia('app-meme');
  const { data: templates = [] } = useAppMedia('app-meme-template');
  const { data: icons = [] } = useAppMedia('app-meme-icon');

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Laugh className="h-6 w-6 text-yellow-600" />
        <div>
          <h2 className="text-xl font-bold">Meme Creator</h2>
          <p className="text-sm text-muted-foreground">
            Manage memes, canvas templates and icons for the Meme Creator in the Pop Art Studio.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 text-center">
            <Laugh className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{memes.length}</p>
            <p className="text-xs text-muted-foreground">Memes</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <LayoutTemplate className="h-6 w-6 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{templates.length}</p>
            <p className="text-xs text-muted-foreground">Templates</p>
          </CardContent>
        </Card>
        <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4 text-center">
            <Shapes className="h-6 w-6 mx-auto mb-1 text-pink-600" />
            <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">{icons.length}</p>
            <p className="text-xs text-muted-foreground">Icons</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="memes">
        <TabsList className="flex w-full gap-1 h-auto flex-wrap justify-start bg-muted/60 p-1">
          <TabsTrigger value="memes" className="flex items-center gap-1.5">
            <Laugh className="h-3.5 w-3.5" />
            Memes
            {memes.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">{memes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5 text-orange-500" />
            Templates
            {templates.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">{templates.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="icons" className="flex items-center gap-1.5">
            <Shapes className="h-3.5 w-3.5 text-pink-500" />
            Icons
            {icons.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">{icons.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Memes tab ── */}
        <TabsContent value="memes" className="mt-4">
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
        </TabsContent>

        {/* ── Templates tab ── */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-orange-600" />
                Meme Creator Templates
              </CardTitle>
              <CardDescription>
                Upload background / canvas template images for the Meme Creator. These appear in the{' '}
                <strong>"Templates"</strong> panel below the canvas in the Pop Art Studio. Users click a template
                to set it as the canvas background.
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Recommended: square or landscape JPG/PNG images at 1080×1080 px or larger.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader type="app-meme-template" label="Template" />
              <MediaList type="app-meme-template" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Icons tab ── */}
        <TabsContent value="icons" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shapes className="h-5 w-5 text-pink-600" />
                Meme Creator Icons
              </CardTitle>
              <CardDescription>
                Upload SVG (or PNG) icons that users can add as extra layers in the Meme Creator. These appear in the
                <strong> "Icons"</strong> tab of the element library in the Pop Art Studio.
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Best format: SVG files for crisp scaling at any size. PNG with transparent background also works.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader type="app-meme-icon" label="Icon" />
              <MediaList type="app-meme-icon" aspectClass="aspect-square" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

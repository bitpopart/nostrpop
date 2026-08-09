import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Box, ExternalLink, Upload, Settings2, Image, Info } from 'lucide-react';

/**
 * VirtualGalleryAdmin
 *
 * A section shown in Admin → Art tab that gives the admin quick access
 * to the POP WORLD virtual gallery.
 *
 * The gallery is a self-contained Three.js HTML app at /gallery and is a
 * public viewing experience — it ships with no admin UI. Artwork is added
 * to the gallery by the BitPopArt admin only, through the main site's
 * "Create Art" flow on the Art page (publishes Nostr kind 39239 events).
 */
export function VirtualGalleryAdmin() {
  const navigate = useNavigate();

  const features = [
    { icon: Image, label: '21 wall frames', desc: 'Curated art hanging on the gallery walls' },
    { icon: Box, label: '15 floor tiles', desc: 'Showcase tiles on the floor' },
    { icon: Upload, label: 'Admin-only uploads', desc: 'Art is added only by the BitPopArt admin' },
    { icon: Settings2, label: 'View-only page', desc: 'No admin controls in the public gallery' },
  ];

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/60 to-pink-50/60 dark:from-orange-900/10 dark:to-pink-900/10">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                POP WORLD Virtual Gallery
                <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 text-xs">
                  3D
                </Badge>
              </CardTitle>
              <CardDescription className="mt-0.5">
                Walkable Three.js gallery — 21 wall frames + 15 floor tiles
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Feature grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-xl border border-orange-100 dark:border-orange-800/50 bg-white/70 dark:bg-gray-800/40 p-3 text-center space-y-1"
            >
              <Icon className="h-5 w-5 mx-auto text-orange-500" />
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-900/10 p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              How artwork gets into the gallery
            </p>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Open the <strong>Art page → "Create Art"</strong> tab (admin only)</li>
              <li>Fill in the artwork details and upload images</li>
              <li>The artwork is published to Nostr (kind 39239) by your admin account</li>
              <li>It then appears in the Art Gallery and POP WORLD accordingly</li>
            </ol>
            <p className="text-xs text-blue-700 dark:text-blue-300 pt-1">
              Only the BitPopArt admin account can upload artwork to the gallery.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate('/gallery')}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md gap-2"
          >
            <Box className="h-5 w-5" />
            Open Virtual Gallery
          </Button>
          <Button
            onClick={() => window.open('/gallery/index.html', '_blank')}
            size="lg"
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          The virtual gallery lives at <code className="bg-muted px-1 py-0.5 rounded text-xs">bitpopart.com/gallery</code>.
          It is a public, view-only experience — the ADMIN button was removed from the gallery page.
        </p>
      </CardContent>
    </Card>
  );
}
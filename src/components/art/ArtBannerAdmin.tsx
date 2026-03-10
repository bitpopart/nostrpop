import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useArtBanner, usePublishArtBanner } from '@/hooks/useArtBanner';
import { useToast } from '@/hooks/useToast';
import { Megaphone, Loader2, Eye, EyeOff, Save } from 'lucide-react';

export function ArtBannerAdmin() {
  const { data: banner, isLoading } = useArtBanner();
  const { mutate: publishBanner, isPending: isSaving } = usePublishArtBanner();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('Store sales available after: (date) You can still purchase but shipping will be delayed.');
  const [subtext, setSubtext] = useState('Because of traveling for TravelTelly.com');

  // Load existing banner data when it arrives
  useEffect(() => {
    if (banner) {
      setEnabled(banner.enabled);
      setMessage(banner.message);
      setSubtext(banner.subtext);
    }
  }, [banner]);

  const handleSave = () => {
    publishBanner(
      { enabled, message, subtext },
      {
        onSuccess: () => {
          toast({
            title: enabled ? 'Banner activated' : 'Banner saved (hidden)',
            description: enabled
              ? 'The banner is now visible on the Art gallery page.'
              : 'Banner saved. Toggle it on to show it on the gallery.',
          });
        },
        onError: () => {
          toast({
            title: 'Save failed',
            description: 'Could not save the banner. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-base">Art Page Banner</CardTitle>
          </div>
          <Badge
            variant={enabled ? 'default' : 'secondary'}
            className={enabled ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {enabled ? (
              <><Eye className="h-3 w-3 mr-1" /> Visible</>
            ) : (
              <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
            )}
          </Badge>
        </div>
        <CardDescription>
          Show a notice banner at the top of the Art gallery — e.g. for shipping delays or travel announcements.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading current banner…
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-white dark:bg-gray-900">
              <div>
                <p className="text-sm font-medium">Show banner on /art page</p>
                <p className="text-xs text-muted-foreground">Toggle off to hide without deleting</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="Toggle banner visibility"
              />
            </div>

            <Separator />

            {/* Main message */}
            <div className="space-y-1.5">
              <Label htmlFor="banner-message" className="text-sm font-medium">
                Main message
              </Label>
              <Textarea
                id="banner-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Store sales available after: June 10, 2026  You can still purchase but shipping will be delayed."
                rows={2}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: include the date directly in this text, e.g. "Store sales available after: June 10, 2026"
              </p>
            </div>

            {/* Subtext */}
            <div className="space-y-1.5">
              <Label htmlFor="banner-subtext" className="text-sm font-medium">
                Sub-text / reason
              </Label>
              <Input
                id="banner-subtext"
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                placeholder="Because of traveling for TravelTelly.com"
              />
            </div>

            {/* Preview */}
            {(message || subtext) && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
                <div className="rounded-lg border border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 py-3 flex items-start gap-3">
                  <Megaphone className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    {message && <p className="font-medium text-orange-800 dark:text-orange-200">{message}</p>}
                    {subtext && <p className="text-orange-600 dark:text-orange-300 text-xs mt-0.5">{subtext}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving || !message.trim()}
              className="w-full"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save banner</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

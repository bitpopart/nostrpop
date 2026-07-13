import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFearGreedMeterImages, usePublishFearGreedMeterImages } from '@/hooks/useFearGreedMeter';
import type { MeterImages } from '@/hooks/useFearGreedMeter';
import { useFearGreedIndex, STATE_LABELS, STATE_DEFAULT_EMOJI, STATE_COLORS } from '@/hooks/useFearGreedIndex';
import type { FearGreedState } from '@/hooks/useFearGreedIndex';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  Upload,
  X,
  Save,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
  Eye,
} from 'lucide-react';

const ALL_STATES: FearGreedState[] = [
  'extreme-fear',
  'fear',
  'neutral',
  'greed',
  'extreme-greed',
];

interface StateCardProps {
  state: FearGreedState;
  currentImageUrl: string | undefined;
  isActive: boolean;  // whether this is the current live state
  onUpload: (state: FearGreedState, url: string) => void;
  onRemove: (state: FearGreedState) => void;
}

function StateImageCard({ state, currentImageUrl, isActive, onUpload, onRemove }: StateCardProps) {
  const [uploading, setUploading] = useState(false);
  const { mutateAsync: uploadFile } = useUploadFile();
  const fileRef = useRef<HTMLInputElement>(null);
  const colors = STATE_COLORS[state];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const tags = await uploadFile(file);
      const url = tags[0]?.[1];
      if (url) onUpload(state, url);
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-3 space-y-2 transition-all ${
        isActive
          ? `${colors.border} ${colors.bg} shadow-lg`
          : 'border-border bg-card'
      }`}
    >
      {/* Active label */}
      {isActive && (
        <Badge className={`absolute -top-2 left-3 text-[10px] border-0 bg-gradient-to-r ${colors.gradient} text-white`}>
          Live now
        </Badge>
      )}

      {/* State label */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${isActive ? colors.text : 'text-foreground'}`}>
          {STATE_LABELS[state]}
        </span>
        <span className="text-2xl leading-none">{STATE_DEFAULT_EMOJI[state]}</span>
      </div>

      {/* Image preview */}
      <div
        className={`relative aspect-square rounded-lg overflow-hidden border border-dashed flex items-center justify-center bg-muted/20 ${
          isActive ? colors.border : 'border-border'
        }`}
      >
        {currentImageUrl ? (
          <>
            <img
              src={currentImageUrl}
              alt={STATE_LABELS[state]}
              className="w-full h-full object-contain p-2"
            />
            {/* Remove button */}
            <button
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow"
              onClick={() => onRemove(state)}
              title="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="text-center space-y-1">
            <span className="text-3xl">{STATE_DEFAULT_EMOJI[state]}</span>
            <p className="text-[10px] text-muted-foreground">Default emoji</p>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload button */}
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs h-7 gap-1"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-3 w-3" />
        {currentImageUrl ? 'Replace' : 'Upload Image'}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.gif,.svg,.webp,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Main Admin component ──────────────────────────────────────────────────────

export function FearGreedMeterAdmin() {
  const { data: savedImages = {}, isLoading: imagesLoading } = useFearGreedMeterImages();
  const { data: fearGreedData, isLoading: fgLoading, refetch } = useFearGreedIndex();
  const { mutate: saveImages, isPending: isSaving } = usePublishFearGreedMeterImages();

  const [draft, setDraft] = useState<MeterImages | null>(null);

  // Use draft if it exists, otherwise use saved
  const images = draft ?? savedImages;
  const isDirty = draft !== null;

  const currentState = fearGreedData?.current?.state;

  const handleUpload = (state: FearGreedState, url: string) => {
    setDraft(prev => ({ ...(prev ?? savedImages), [state]: url }));
  };

  const handleRemove = (state: FearGreedState) => {
    setDraft(prev => {
      const next = { ...(prev ?? savedImages) };
      delete next[state];
      return next;
    });
  };

  const handleSave = () => {
    saveImages(images, {
      onSuccess: () => setDraft(null),
    });
  };

  const handleDiscard = () => setDraft(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Fear &amp; Greed Meter Images
          </CardTitle>
          <CardDescription>
            Upload custom emoji or illustration images for each of the 5 Fear &amp; Greed states.
            These appear on the <strong>/block</strong> page in the Bitcoin dashboard.
            If no custom image is uploaded, the default emoji is used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Live status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Live index:</span>
              {fgLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : fearGreedData ? (
                <span className="font-bold">
                  {fearGreedData.current.value} – {STATE_LABELS[fearGreedData.current.state]}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">unavailable</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-6 gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <a
              href="/block"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 underline decoration-dotted"
            >
              <Eye className="h-3 w-3" />
              Preview on /block
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Image cards grid */}
      {imagesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {ALL_STATES.map(state => (
            <StateImageCard
              key={state}
              state={state}
              currentImageUrl={images[state]}
              isActive={currentState === state}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Tips */}
      <Card className="bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground text-sm">💡 Tips for meter images</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Use <strong>PNG or WebP</strong> with transparent backgrounds for best results</li>
            <li>Square images (e.g. 512×512) work best in the circular meter area</li>
            <li>Animated GIFs are supported and add extra flair!</li>
            <li>The highlighted card shows the <em>current live state</em> of the index</li>
            <li>Changes are saved to Nostr and visible to all visitors immediately after saving</li>
          </ul>
        </CardContent>
      </Card>

      {/* Save / Discard bar */}
      <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all ${
        isDirty
          ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
          : 'border-transparent bg-transparent'
      }`}>
        <span className={`text-sm ${isDirty ? 'text-orange-700 dark:text-orange-300 font-medium' : 'text-muted-foreground'}`}>
          {isDirty ? '⚠️ You have unsaved changes' : '✓ All changes saved'}
        </span>
        <div className="flex gap-2">
          {isDirty && (
            <Button variant="outline" size="sm" onClick={handleDiscard}>
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 border-0"
          >
            {isSaving ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
            ) : (
              <><Save className="h-3.5 w-3.5" />Save to Nostr</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

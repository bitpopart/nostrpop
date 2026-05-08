import { useState, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Plus, Calendar, Loader2, Trash2, Edit, X, Upload, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { NostrEvent } from '@nostrify/nostrify';
import { POPUP_TYPE_CONFIG, POPUP_STATUS_CONFIG, coordinatesToGeohash, generateUUID, type PopUpType, type PopUpStatus } from '@/lib/popupTypes';

interface PopUpFormData {
  title: string;
  description: string;
  type: PopUpType;
  status: PopUpStatus;
  location: string;
  latitude: string;
  longitude: string;
  startDate: string;
  endDate: string;
  image: string;
  galleryImages: string[];
  link: string;
  brandSite: string;
  finished: boolean;
}

function BrandSiteUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const tags = await uploadFile(file);
      const url = tags[0][1];
      onUploaded(url);
      toast.success('File uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.html,.htm" className="hidden" onChange={handleUpload} disabled={uploading} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-1.5"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? 'Uploading...' : 'Upload PDF / HTML'}
      </Button>
    </>
  );
}

export function PopUpManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PopUpFormData>({
    title: '',
    description: '',
    type: 'art',
    status: 'confirmed',
    location: '',
    latitude: '',
    longitude: '',
    startDate: '',
    endDate: '',
    image: '',
    galleryImages: [],
    link: '',
    brandSite: '', // Added for brand site input
    finished: false,
  });

  const handleInputChange = (field: keyof PopUpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create/Edit PopUp Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          {/* Existing Input Fields */}
          {/* Brand Site Field */}
          <div className="space-y-2">
            <Label htmlFor="brandSite">Event Brand Website (optional)</Label>
            <Input
              id="brandSite"
              placeholder="https://... or upload a PDF URL"
              value={formData.brandSite}
              onChange={(e) => handleInputChange('brandSite', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL to an event project page, brochure PDF, or brand downloads page. Opens in-frame on your site.
            </p>
            <BrandSiteUpload
              onUploaded={(url) => setFormData(prev => ({ ...prev, brandSite: url }))}
            />
          </div>
          {/* Existing Submit Button */}
        </form>
      </CardContent>
    </Card>
  );
}
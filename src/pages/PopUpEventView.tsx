import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Calendar, ExternalLink, Globe, Share2, Image as ImageIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { POPUP_TYPE_CONFIG, POPUP_STATUS_CONFIG, type PopUpEventData } from '@/lib/popupTypes';
import { WorldMap } from '@/components/popup/WorldMap';
import { ShareDialog } from '@/components/share/ShareDialog';
import { ZapButton } from '@/components/ZapButton';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { SocialShareButtons } from '@/components/SocialShareButtons';

export default function PopUpEventView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const isAdmin = useIsAdmin();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Fetch single event
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['popup-event', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [31922], '#d': [eventId!], '#t': ['bitpopart-popup'], limit: 1 }],
        { signal }
      );
      if (events.length === 0) return null;
      const event = events[0];
      const id = event.tags.find(t => t[0] === 'd')?.[1] || event.id;
      const title = event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled';
      const location = event.tags.find(t => t[0] === 'location')?.[1] || '';
      const startDate = event.tags.find(t => t[0] === 'start')?.[1] || '';
      const endDate = event.tags.find(t => t[0] === 'end')?.[1];
      const image = event.tags.find(t => t[0] === 'image')?.[1];
      const galleryImages = event.tags.filter(t => t[0] === 'gallery').map(t => t[1]);
      const link = event.tags.find(t => t[0] === 'r')?.[1];
      const brandSite = event.tags.find(t => t[0] === 'brand-site')?.[1];
      const type = event.tags.find(t => t[0] === 't' && ['art', 'shop', 'event'].includes(t[1]))?.[1] as 'art' | 'shop' | 'event' || 'art';
      const status = event.tags.find(t => t[0] === 'status')?.[1] as 'confirmed' | 'option' || 'confirmed';
      const isFinished = event.tags.find(t => t[0] === 'finished')?.[1] === 'true';
      let description = '';
      let latitude = 0;
      let longitude = 0;
      try {
        const contentData = JSON.parse(event.content);
        description = contentData.description || '';
        latitude = contentData.coordinates?.lat || 0;
        longitude = contentData.coordinates?.lon || 0;
      } catch {
        description = event.content;
      }
      return {
        id,
        title,
        description,
        type,
        status,
        location,
        latitude,
        longitude,
        startDate,
        endDate,
        image,
        galleryImages,
        link,
        brandSite,
        event,
        isFinished,
      };
    },
    enabled: !!eventId,
  });

  useSeoMeta({
    title: eventData ? `${eventData.title} - PopUp Event` : 'PopUp Event',
    description: eventData?.description || 'BitPopArt PopUp event details',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Event Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This event could not be found.
              </p>
              <Button onClick={() => navigate('/popup')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const typeConfig = POPUP_TYPE_CONFIG[eventData.type];
  const statusConfig = POPUP_STATUS_CONFIG[eventData.status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/popup')}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image and Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-4xl font-bold mb-4 gradient-header-text">
                      {eventData.title}
                    </CardTitle>
                    <div className="space-y-3 text-muted-foreground">
                      {/* Other event details */}
                    </div>
                    {/* New Event Project Site Button */}
                    {eventData.brandSite && (
                      <Button
                        onClick={() => window.open(eventData.brandSite, '_blank')}
                        className="w-full"
                      >
                        Event Project Site
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>{eventData.description}</div>
              </CardContent>
            </Card>
            {/* Additional Button under Event Information */}
            <div className="space-y-4">
              <p>Additional Information:</p>
              <Button
                onClick={() => window.open(eventData.brandSite, '_blank')}
                className="w-full"
              >
                Brand Site for More Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
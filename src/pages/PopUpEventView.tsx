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
import { ArrowLeft, MapPin, Calendar, ExternalLink, Globe, Share2, Image as ImageIcon } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            {eventData.image && (
              <Card className="overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={eventData.image}
                    alt={eventData.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className={`${typeConfig.bgColor} ${typeConfig.color} border shadow-lg`}>
                      {typeConfig.icon} {typeConfig.label}
                    </Badge>
                    {eventData.status === 'option' && (
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border shadow-lg`}>
                        {statusConfig.label}
                      </Badge>
                    )}
                    {eventData.isFinished && (
                      <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border shadow-lg">
                        📅 Past Event
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Event Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-4xl font-bold mb-4 gradient-header-text">
                      {eventData.title}
                    </CardTitle>
                    <div className="space-y-3 text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">{eventData.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">
                            {format(new Date(eventData.startDate), 'EEEE, MMMM d, yyyy')}
                            {eventData.endDate && (
                              <>
                                <br />
                                <span className="text-sm text-muted-foreground">
                                  to {format(new Date(eventData.endDate), 'EEEE, MMMM d, yyyy')}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Zap Button */}
                  {eventData.event && (
                    <ZapButton
                      authorPubkey={eventData.event.pubkey}
                      event={eventData.event}
                      eventTitle={eventData.title}
                      size="lg"
                      variant="default"
                      className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg"
                      showLabel={true}
                    />
                  )}
                </div>
              </CardHeader>
              {eventData.description && (
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {eventData.description}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Gallery */}
            {eventData.galleryImages && eventData.galleryImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Photo Gallery ({eventData.galleryImages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {eventData.galleryImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                        onClick={() => setSelectedImage(imgUrl)}
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery ${index + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map */}
            {eventData.latitude && eventData.longitude && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] w-full">
                    <WorldMap events={[eventData as PopUpEventData]} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventData.link && (
                  <Button asChild className="w-full" variant="default">
                    <a href={eventData.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Event Website
                    </a>
                  </Button>
                )}

                {/* Share Button */}
                {eventData.event && (
                  <ShareDialog
                    title={eventData.title}
                    description={eventData.description}
                    url={`${window.location.origin}/popup/${eventData.id}`}
                    imageUrl={eventData.image}
                    category={eventData.type}
                    contentType="event"
                    eventRef={{
                      id: eventData.event.id,
                      kind: eventData.event.kind,
                      pubkey: eventData.event.pubkey,
                      dTag: eventData.id
                    }}
                  >
                    <Button variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Event
                    </Button>
                  </ShareDialog>
                )}

                {/* Admin Share Buttons */}
                {isAdmin && eventData.event && (
                  <div className="pt-2">
                    <SocialShareButtons
                      event={eventData.event}
                      url={`/popup/${eventData.id}`}
                      title={eventData.title}
                      description={eventData.description}
                      image={eventData.image}
                      contentType="popup"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Event Type</p>
                  <Badge className={`${typeConfig.bgColor} ${typeConfig.color} border`}>
                    {typeConfig.icon} {typeConfig.label}
                  </Badge>
                </div>

                {eventData.status === 'option' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                )}

                {eventData.isFinished && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event Status</p>
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border">
                      📅 Past Event
                    </Badge>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {eventData.location}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-medium flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {format(new Date(eventData.startDate), 'EEEE, MMMM d, yyyy')}
                      {eventData.endDate && (
                        <>
                          <br />
                          <span className="text-sm text-muted-foreground">
                            to {format(new Date(eventData.endDate), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </>
                      )}
                    </span>
                  </p>
                </div>

                {eventData.latitude && eventData.longitude && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Coordinates</p>
                    <p className="font-mono text-sm">
                      {eventData.latitude.toFixed(4)}, {eventData.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Lightbox */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 max-h-[90vh] overflow-auto">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Gallery"
                className="w-full h-auto object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

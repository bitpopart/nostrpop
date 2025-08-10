import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteContent } from '@/components/NoteContent';
import { useAuthor } from '@/hooks/useAuthor';
import { useAdminNotes } from '@/hooks/useAdminNotes';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';
import { getFirstImage } from '@/lib/extractImages';
import {
  MessageSquare,
  Calendar,
  User,
  ArrowLeft,
  Rss
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';

// Convert npub to hex
const ADMIN_HEX = nip19.decode(ADMIN_NPUB).data as string;

function NoteCard({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(event.created_at * 1000);

  // Extract first image from the note
  const firstImage = getFirstImage(event.content, event.tags);

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
      {/* Note Image Thumbnail */}
      {firstImage && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={firstImage.url}
            alt={firstImage.alt || 'Note image'}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image if it fails to load
              const container = e.currentTarget.parentElement;
              if (container) {
                container.style.display = 'none';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-semibold truncate">
                {displayName}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{createdAt.toLocaleDateString()}</span>
              <span>•</span>
              <span>{createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <NoteContent event={event} className="text-sm leading-relaxed" />
        </div>
      </CardContent>
    </Card>
  );
}

function NoteSkeleton() {
  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      {/* Potential image area */}
      <div className="aspect-video">
        <Skeleton className="w-full h-full" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </CardContent>
    </Card>
  );
}

const Feed = () => {
  const { data: notes, isLoading, error } = useAdminNotes(10);
  const author = useAuthor(ADMIN_HEX);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const displayName = metadata?.name ?? genUserName(ADMIN_HEX);

  useSeoMeta({
    title: `${displayName}'s Feed - BitPop Cards`,
    description: `Latest updates and notes from ${displayName} on the BitPop Cards platform.`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Rss className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {displayName}'s Feed
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              Latest updates and announcements from the BitPop Cards admin
            </p>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <span>💡 Tip: Switch relays to discover more content from different Nostr networks</span>
              </div>
              <RelaySelector />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {error && (
            <Card className="border-dashed border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <MessageSquare className="h-12 w-12 mx-auto text-red-500" />
                  <div>
                    <CardTitle className="text-red-600 dark:text-red-400 mb-2">
                      Failed to Load Notes
                    </CardTitle>
                    <CardDescription>
                      Unable to fetch the latest notes. Try switching to a different relay.
                    </CardDescription>
                  </div>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <NoteSkeleton key={i} />
              ))}
            </div>
          )}

          {notes && notes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <CardTitle className="mb-2">No Notes Found</CardTitle>
                    <CardDescription>
                      No notes found from this admin. Try switching to a different relay to discover content.
                    </CardDescription>
                  </div>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {notes && notes.length > 0 && (
            <div className="space-y-6">
              {notes.map((note) => (
                <NoteCard key={note.id} event={note} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Admin Feed • BitPop Cards Platform</p>
          <p className="mt-2">
            Vibed with <a href="https://soapbox.pub/mkstack" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">MKStack</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
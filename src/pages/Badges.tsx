import { useState, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNIP58BadgeDefinitions, useNIP58BadgeAwards } from '@/hooks/useNIP58Badges';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, ExternalLink, Users, Sparkles, Copy, Check } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';

// --- Awardee Row ---
function AwardeeRow({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={metadata?.picture} alt={displayName} />
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{displayName}</p>
        {metadata?.nip05 && (
          <p className="text-xs text-muted-foreground truncate">{metadata.nip05}</p>
        )}
      </div>
      <a
        href={`https://njump.me/${npub}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// --- Badge Card ---
function BadgeCard({
  definition,
  awardeeCount,
  onClick,
}: {
  definition: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    thumbs: { url: string; size?: string }[];
    naddr: string;
    pubkey: string;
  };
  awardeeCount: number;
  onClick: () => void;
}) {
  // Pick best thumbnail for grid display (256x256 or first thumb or full image)
  const thumb =
    definition.thumbs.find(t => t.size === '256x256')?.url ??
    definition.thumbs[0]?.url ??
    definition.image;

  return (
    <Card
      className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700"
      onClick={onClick}
    >
      {/* Badge image square */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        {thumb ? (
          <img
            src={thumb}
            alt={definition.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award className="h-16 w-16 text-purple-300 dark:text-purple-700" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-sm font-semibold px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            View Details
          </span>
        </div>
      </div>

      {/* Info row */}
      <CardContent className="px-3 py-3">
        <h3 className="font-semibold text-sm truncate mb-1 group-hover:text-purple-600 transition-colors">
          {definition.name}
        </h3>
        {awardeeCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{awardeeCount} {awardeeCount === 1 ? 'holder' : 'holders'}</span>
          </div>
        )}
        {awardeeCount === 0 && definition.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{definition.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// --- NAddr Copy Button ---
function NAddrCopy({ naddr }: { naddr: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`nostr:${naddr}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy naddr'}
    </Button>
  );
}

// --- Badge Detail Dialog ---
function BadgeDetailDialog({
  badge,
  awards,
  open,
  onClose,
}: {
  badge: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    thumbs: { url: string; size?: string }[];
    naddr: string;
    pubkey: string;
  } | null;
  awards: { badgeAddr: string; awardees: string[] }[];
  open: boolean;
  onClose: () => void;
}) {
  if (!badge) return null;

  const highRes = badge.image ?? badge.thumbs.find(t => t.size === '512x512')?.url ?? badge.thumbs[0]?.url;
  const badgeCoord = `30009:${badge.pubkey}:${badge.id}`;
  const relevantAwards = awards.filter(a => a.badgeAddr === badgeCoord);
  const allAwardees = Array.from(new Set(relevantAwards.flatMap(a => a.awardees)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{badge.name}</DialogTitle>
        </DialogHeader>

        {/* Badge hero */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0 w-full sm:w-40">
            {highRes ? (
              <img
                src={highRes}
                alt={badge.name}
                className="w-full sm:w-40 sm:h-40 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-full sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <Award className="h-16 w-16 text-purple-400" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-bold">{badge.name}</h2>
              {badge.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {badge.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                NIP-58 Badge
              </Badge>
              {allAwardees.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {allAwardees.length} {allAwardees.length === 1 ? 'holder' : 'holders'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <NAddrCopy naddr={badge.naddr} />
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5"
              >
                <a
                  href={`https://badges.page/a/${badge.naddr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  badges.page
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Awardees list */}
        {allAwardees.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Badge Holders ({allAwardees.length})
            </h3>
            <div className="divide-y divide-border rounded-lg border overflow-hidden max-h-72 overflow-y-auto">
              {allAwardees.map((pk) => (
                <AwardeeRow key={pk} pubkey={pk} />
              ))}
            </div>
          </div>
        )}

        {allAwardees.length === 0 && (
          <div className="mt-4 text-center py-6 text-muted-foreground text-sm">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No holders yet — be the first!
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Page skeleton ---
function BadgesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// --- Main Page ---
export default function Badges() {
  useSeoMeta({
    title: 'Badges - BitPopArt',
    description: 'Collect exclusive NIP-58 badges by BitPopArt. Issued on the Nostr protocol.',
  });

  const { data: definitions = [], isLoading } = useNIP58BadgeDefinitions();

  // Build list of badge coords for award lookup
  const badgeAddrs = useMemo(
    () => definitions.map(d => `30009:${d.pubkey}:${d.id}`),
    [definitions]
  );

  const { data: awards = [] } = useNIP58BadgeAwards(badgeAddrs);

  // Enrich definitions with awardee counts
  const enriched = useMemo(() => {
    return definitions.map(def => {
      const coord = `30009:${def.pubkey}:${def.id}`;
      const relevant = awards.filter(a => a.badgeAddr === coord);
      const count = new Set(relevant.flatMap(a => a.awardees)).size;
      return { definition: def, awardeeCount: count };
    });
  }, [definitions, awards]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDef = definitions.find(d => d.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-3 gap-3">
            <Award className="h-9 w-9 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Badges
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Exclusive NIP-58 Nostr badges by BitPopArt — collect &amp; display them on your profile.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3" />
              NIP-58 Standard
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              Kind 30009 · Kind 8
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              Profile Badges: kind 10008
            </Badge>
          </div>
        </div>

        {/* ── Badge Grid ── */}
        {isLoading ? (
          <BadgesSkeleton />
        ) : enriched.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {enriched.map(({ definition, awardeeCount }) => (
              <BadgeCard
                key={definition.id}
                definition={definition}
                awardeeCount={awardeeCount}
                onClick={() => setSelectedId(definition.id)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-4">
                <Award className="h-14 w-14 mx-auto text-muted-foreground opacity-40" />
                <p className="font-semibold">No badges published yet</p>
                <p className="text-sm text-muted-foreground">
                  Try switching to a different relay to find badges.
                </p>
                <RelaySelector className="w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── About NIP-58 ── */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="bg-white/60 dark:bg-gray-800/40 border-purple-100 dark:border-purple-900/30">
            <CardContent className="py-6 px-6 space-y-3">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                About Nostr Badges (NIP-58)
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Badges on Nostr follow <strong>NIP-58</strong>. Each badge is defined by a{' '}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:30009</code> event
                (Badge Definition). When a badge is awarded, the issuer publishes a{' '}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:8</code> event
                (Badge Award) referencing the definition and listing recipients.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To display your badges on your profile, publish a{' '}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:10008</code> event
                (Profile Badges) — the new standard per{' '}
                <a
                  href="https://github.com/nostr-protocol/nips/issues/2275"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-purple-600"
                >
                  NIP proposal #2275
                </a>
                , replacing the older <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:30008</code>.
              </p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/nostr-protocol/nips/blob/master/58.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    NIP-58 Spec
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://badges.page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    badges.page
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Footer ── */}
        <div className="text-center mt-12 text-xs text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/nostr-protocol/nips/blob/master/58.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-purple-600"
            >
              NIP-58
            </a>{' '}
            &amp; Nostr ⚡
          </p>
        </div>
      </div>

      {/* ── Detail Dialog ── */}
      <BadgeDetailDialog
        badge={selectedDef}
        awards={awards}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import { AlertTriangle, Check, Inbox, Loader2, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthor } from '@/hooks/useAuthor';
import {
  matchClaimCode,
  useBadgeClaims,
  useBadgeCodeAdmin,
  usePrivateBadgeCodes,
} from '@/hooks/useBadgeCodes';
import type { NIP58BadgeDefinition } from '@/hooks/useNIP58Badges';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { ParsedClaim } from '@/lib/badgeClaims';
import { genUserName } from '@/lib/genUserName';

interface AwardLike {
  badgeAddr: string;
  awardees: string[];
}

function ClaimRow({
  claim,
  def,
  codes,
  readable,
}: {
  claim: ParsedClaim;
  def: NIP58BadgeDefinition | undefined;
  codes: string[];
  readable: boolean;
}) {
  const author = useAuthor(claim.claimant);
  const name = author.data?.metadata?.name ?? genUserName(claim.claimant);
  const npub = nip19.npubEncode(claim.claimant);
  const queryClient = useQueryClient();
  const { mutateAsync: publish } = useNostrPublish();
  const { retireCode } = useBadgeCodeAdmin();
  const [busy, setBusy] = useState(false);

  // Does the proof in the note match one of the unused codes? Needs the private list.
  const { data: match, isLoading: checking } = useQuery({
    queryKey: ['badge-claim-match', claim.eventId, codes.length],
    queryFn: () => matchClaimCode(claim, codes),
    enabled: readable,
    staleTime: Infinity,
  });

  const award = async () => {
    if (!def) return;
    setBusy(true);
    try {
      await publish({
        kind: 8,
        content: '',
        tags: [
          ['a', `30009:${def.pubkey}:${def.id}`],
          ['p', claim.claimant],
        ],
      });
      let retired = true;
      if (match) {
        try {
          await retireCode(def.id, match);
        } catch (e) {
          retired = false;
          toast.error('Badge awarded, but the code could not be retired: ' + (e as Error).message);
        }
      }
      if (retired) toast.success(`${def.name} awarded to ${name}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nip58-badge-awards'] }),
        queryClient.invalidateQueries({ queryKey: ['badge-claims'] }),
      ]);
    } catch (e) {
      toast.error('Could not award: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const status = !readable ? (
    <Badge variant="outline" className="gap-1">
      <AlertTriangle className="h-3 w-3" /> Cannot check
    </Badge>
  ) : checking ? (
    <Badge variant="outline" className="gap-1">
      <Loader2 className="h-3 w-3 animate-spin" /> Checking
    </Badge>
  ) : match ? (
    <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
      <ShieldCheck className="h-3 w-3" /> Valid code
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" /> No matching code
    </Badge>
  );

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={author.data?.metadata?.picture} alt={name} />
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {def?.name ?? claim.badgeId} · {new Date(claim.createdAt * 1000).toLocaleString()}
        </p>
        <a
          className="text-xs text-muted-foreground underline"
          href={`https://njump.me/${npub}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {npub.slice(0, 16)}…
        </a>
      </div>
      {status}
      <Button
        size="sm"
        variant={match ? 'default' : 'outline'}
        className="gap-1.5"
        onClick={award}
        disabled={busy || !def}
        title={match ? 'Award the badge and retire the code' : 'The proof did not match. Award only if you know this person.'}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        {match ? 'Award & retire code' : 'Award anyway'}
      </Button>
    </div>
  );
}

/** Owner only: claims people sent with a code, checked and ready to award. */
export function BadgeClaimsAdmin({
  definitions,
  awards,
}: {
  definitions: NIP58BadgeDefinition[];
  awards: AwardLike[];
}) {
  const { data: claims = [], isLoading, isFetching, refetch } = useBadgeClaims(true);
  const { data: priv } = usePrivateBadgeCodes();

  const waiting = claims.filter((c) => {
    const def = definitions.find((d) => d.id === c.badgeId);
    if (!def) return true;
    const coord = `30009:${def.pubkey}:${def.id}`;
    return !awards.some((a) => a.badgeAddr === coord && a.awardees.includes(c.claimant));
  });

  return (
    <Card className="mx-auto mb-10 max-w-4xl border-2 border-orange-300">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-5 w-5 text-orange-600" />
          Claims waiting {waiting.length > 0 && <Badge className="bg-orange-600 text-white">{waiting.length}</Badge>}
        </CardTitle>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {priv && !priv.readable && (
          <p className="mx-3 mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            The saved code list could not be opened, so claims cannot be checked automatically. Log in with the BitPopArt
            account and a signer that supports NIP-44.
          </p>
        )}
        {isLoading ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Looking for claims…</p>
        ) : waiting.length === 0 ? (
          <p className="flex items-center gap-2 px-4 pb-4 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-600" /> No claims waiting.
          </p>
        ) : (
          <div className="divide-y border-t">
            {waiting.map((claim) => (
              <ClaimRow
                key={claim.eventId}
                claim={claim}
                def={definitions.find((d) => d.id === claim.badgeId)}
                codes={priv?.codes[claim.badgeId] ?? []}
                readable={!!priv?.readable}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

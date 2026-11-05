import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useFundraiserContributions } from '@/hooks/useFundraisers';
import { useBtcEurRate, eurToLiveSats } from '@/hooks/usePrintPosters';
import { ShareToNostrButton } from '@/components/ShareToNostrButton';
import { ClawstrShare } from '@/components/ClawstrShare';
import { ZapButton } from '@/components/ZapButton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Calendar, 
  Users, 
  TrendingUp,
  Zap,
  Copy,
  CheckCircle2,
  Info,
  ExternalLink,
  Gift,
} from 'lucide-react';
import { formatSats, calculateProgress, isExternalFundraiser, type FundraiserData, type FundraiserContribution, type FundraiserTier } from '@/lib/fundraiserTypes';

interface FundraiserCardProps {
  fundraiser: FundraiserData;
}

/** Turn an in-site URL into a router path when it points at this site;
 *  return null when it should be treated as an external link. */
function toSitePath(url: string): string | null {
  if (url.startsWith('/')) return url;
  try {
    const u = new URL(url);
    const site = new URL(window.location.origin);
    if (u.origin === site.origin) return u.pathname + u.search + u.hash;
    return null;
  } catch {
    return null;
  }
}

function ContributorRow({ contribution, index }: { contribution: FundraiserContribution; index: number }) {
  const contributorAuthor = useAuthor(contribution.contributor_npub);
  const contributorMeta = contributorAuthor.data?.metadata;

  return (
    <div className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
          {index + 1}
        </Badge>
        <Avatar className="h-6 w-6">
          <AvatarImage src={contributorMeta?.picture} />
          <AvatarFallback>{contributorMeta?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{contributorMeta?.name || 'Anonymous'}</span>
      </div>
      <span className="font-semibold text-purple-600 dark:text-purple-400">
        {formatSats(contribution.amount_sats)} sats
      </span>
    </div>
  );
}

export function FundraiserCard({ fundraiser }: FundraiserCardProps) {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { mutate: createEvent } = useNostrPublish();
  const author = useAuthor(fundraiser.author_pubkey);
  const authorMetadata = author.data?.metadata;
  
  const { data: contributions = [] } = useFundraiserContributions(fundraiser.id);
  
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FundraiserTier | null>(null);

  // Live BTC/EUR rate for converting priced tiers (EUR -> sats)
  const { data: btcRate } = useBtcEurRate();

  // Where the campaign collects donations: here (goal/progress + Lightning
  // dialog) or on an external fundraising page (card links out, new tab).
  const external = isExternalFundraiser(fundraiser);

  // Calculate total raised
  const totalRaised = contributions.reduce((sum, c) => sum + c.amount_sats, 0);
  const progress = calculateProgress(totalRaised, fundraiser.goal_sats);
  const contributorCount = contributions.length;

  // Top contributors (top 5)
  const topContributors = contributions.slice(0, 5);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('bitpopart@walletofsatoshi.com');
    setIsCopied(true);
    toast.success('Lightning address copied!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  /** Open the contribute dialog for a tier, pre-filling the sats amount for priced tiers. */
  const openTierDialog = (tier: FundraiserTier) => {
    setSelectedTier(tier);
    setAmount(tier.price_eur ? String(eurToLiveSats(tier.price_eur, btcRate) || '') : '');
    setMessage('');
    setIsContributeOpen(true);
  };

  const tierSats = selectedTier?.price_eur ? eurToLiveSats(selectedTier.price_eur, btcRate) || null : null;

  const handleSubmitContribution = () => {
    if (!user) {
      toast.error('Please log in to contribute');
      return;
    }
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const tags: string[][] = [
      ['f', fundraiser.id], // Reference to fundraiser
      ['a', `38178:${fundraiser.author_pubkey}:${fundraiser.id}`], // Addressable reference
      ['amount', amount],
      ['p', fundraiser.author_pubkey], // Tag the fundraiser creator
    ];

    const contentData = {
      amount_sats: parseInt(amount),
      message: message || undefined,
    };

    createEvent(
      {
        kind: 38179,
        content: JSON.stringify(contentData),
        tags,
      },
      {
        onSuccess: () => {
          toast.success('Contribution recorded! Please send payment to the Lightning address.');
          setIsContributeOpen(false);
          setSelectedTier(null);
          setAmount('');
          setMessage('');
        },
        onError: (error) => {
          console.error('Publish error:', error);
          toast.error('Failed to record contribution');
        },
      }
    );
  };

  const isDeadlinePassed = fundraiser.deadline 
    ? new Date(fundraiser.deadline) < new Date() 
    : false;

  const canContribute = fundraiser.status === 'active' && !isDeadlinePassed;

  // Normalize the in-site "more about the project" URL for router navigation
  const projectPath = fundraiser.project_url ? toSitePath(fundraiser.project_url) : null;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      {/* Fundraiser Image */}
      {fundraiser.thumbnail && (
        <div className="aspect-video w-full overflow-hidden relative group">
          <img
            src={fundraiser.thumbnail}
            alt={fundraiser.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Zap button overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZapButton
              authorPubkey={fundraiser.author_pubkey}
              event={fundraiser.event}
              eventTitle={fundraiser.title}
              size="sm"
              variant="default"
              className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg h-8 w-8 p-0"
              showLabel={false}
            />
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{fundraiser.title}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={authorMetadata?.picture} />
                <AvatarFallback>{authorMetadata?.name?.[0] || 'A'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                by {authorMetadata?.name || 'Anonymous'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={fundraiser.status === 'active' ? 'default' : fundraiser.status === 'completed' ? 'secondary' : 'destructive'}>
              {fundraiser.status}
            </Badge>
            {isAdmin && (
              <div className="flex gap-1">
                <ShareToNostrButton
                  url={`/fundraising/${fundraiser.id}`}
                  title={fundraiser.title}
                  description={fundraiser.description}
                  image={fundraiser.thumbnail}
                  variant="ghost"
                  size="sm"
                />
                <ClawstrShare
                  event={fundraiser.event}
                  contentType="fundraiser"
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Target className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Description */}
        <CardDescription className="text-base whitespace-pre-wrap">
          {fundraiser.description}
        </CardDescription>

        {/* Progress (on-site goal only) */}
        {!external ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">{formatSats(totalRaised)} sats raised</span>
              <span className="text-muted-foreground">of {formatSats(fundraiser.goal_sats)} sats</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress}% funded</span>
              {fundraiser.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isDeadlinePassed ? 'Ended ' : 'Ends '}
                  {new Date(fundraiser.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
            <span>
              This campaign runs on an external fundraising page.
              {fundraiser.deadline && (
                <>
                  {' '}
                  {isDeadlinePassed ? 'It ended ' : 'It ends '}
                  on {new Date(fundraiser.deadline).toLocaleDateString()}.
                </>
              )}
            </span>
          </div>
        )}

        {/* Stats */}
        {!external && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-2xl font-bold">{contributorCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">Contributors</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-pink-600 dark:text-pink-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-2xl font-bold">{progress}%</span>
              </div>
              <span className="text-xs text-muted-foreground">Complete</span>
            </div>
          </div>
        )}

        {/* Top Contributors */}
        {!external && topContributors.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top Contributors
            </h3>
            <div className="space-y-2">
              {topContributors.map((contribution, index) => (
                <ContributorRow key={index} contribution={contribution} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Support Tiers (on-site campaigns only) */}
        {!external && fundraiser.tiers && fundraiser.tiers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Support Tiers
            </h3>
            <div className="space-y-3">
              {fundraiser.tiers.map((tier) => {
                const tierSats = tier.price_eur ? eurToLiveSats(tier.price_eur, btcRate) || null : null;
                return (
                  <div key={tier.id} className="border rounded-lg p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{tier.name}</h4>
                        {tier.description && (
                          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                        )}
                        {tier.product_url && (
                          <a
                            href={tier.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View the product
                          </a>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {tier.price_eur !== undefined ? (
                          <>
                            <div className="font-semibold">€{tier.price_eur}</div>
                            <div className="text-xs text-muted-foreground">
                              {tierSats ? `≈ ${formatSats(tierSats)} sats` : '… sats'}
                            </div>
                          </>
                        ) : (
                          <Badge variant="outline">any amount</Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => openTierDialog(tier)}>
                      <Zap className="h-4 w-4 mr-2" />
                      {tier.price_eur !== undefined ? 'Contribute for this tier' : 'Support this tier'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project / External URL links */}
        {(fundraiser.project_url || fundraiser.external_url) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {fundraiser.project_url && (projectPath !== null ? (
              <Button asChild variant="outline" className="flex-1">
                <Link to={projectPath}>
                  <Info className="h-4 w-4 mr-2" />
                  More about the project
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="flex-1">
                <a href={fundraiser.project_url} target="_blank" rel="noopener noreferrer">
                  <Info className="h-4 w-4 mr-2" />
                  More about the project
                </a>
              </Button>
            ))}
            {fundraiser.external_url && !external && (
              <Button asChild variant="outline" className="flex-1">
                <a href={fundraiser.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Fundraising site
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Contribute Button / External fundraising page CTA */}
        {external ? (
          <Button
            asChild
            className={`w-full ${!canContribute ? 'pointer-events-none opacity-50' : ''}`}
            size="lg"
          >
            <a
              href={fundraiser.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!canContribute) e.preventDefault();
              }}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              {!canContribute
                ? (isDeadlinePassed ? 'Fundraiser Ended' : `${fundraiser.status}`)
                : 'Go to fundraising page'}
            </a>
          </Button>
        ) : (
        <Dialog
          open={isContributeOpen}
          onOpenChange={(open) => {
            setIsContributeOpen(open);
            if (!open) {
              setSelectedTier(null);
              setAmount('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              size="lg"
              disabled={!canContribute}
            >
              <Zap className="h-5 w-5 mr-2" />
              {!canContribute 
                ? (isDeadlinePassed ? 'Fundraiser Ended' : `${fundraiser.status}`) 
                : 'Contribute Now'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contribute to {fundraiser.title}</DialogTitle>
              <DialogDescription>
                Support this project with Bitcoin via Lightning Network
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Selected tier */}
              {selectedTier && (
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/20 p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm">{selectedTier.name}</span>
                    {selectedTier.price_eur !== undefined && (
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex-shrink-0">
                        €{selectedTier.price_eur}
                        {tierSats ? ` · ${formatSats(tierSats)} sats` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pay in sats — the amount below is pre-filled for this tier (you can adjust it).
                  </p>
                </div>
              )}
              {/* Lightning Address */}
              <div className="space-y-2">
                <Label>Lightning Address</Label>
                <div className="flex gap-2">
                  <Input 
                    value="bitpopart@walletofsatoshi.com" 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                  >
                    {isCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send your contribution to this address, then record it below
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (sats) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Leave a message of support..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> First send the payment to the Lightning address above, then click "Record Contribution" to register your support on Nostr.
                </p>
              </div>

              <Button 
                onClick={handleSubmitContribution} 
                className="w-full"
                disabled={!user}
              >
                Record Contribution
              </Button>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Please log in with Nostr to record your contribution
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

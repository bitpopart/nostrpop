/**
 * ProposalPublicPage — publicly accessible at /proposal/:slug
 *
 * No login required. Anyone with the link can view the proposal.
 * The proposal content is stored in localStorage (same device as admin).
 *
 * Note: because all data lives in localStorage, the proposal is only
 * visible to people using the same browser/device where it was created
 * UNLESS the app is deployed and data is synced (e.g. via Nostr or a server).
 * For sharing across devices, use the PDF URL or iframe URL option which
 * points to an external hosted file.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import { getProposalBySlug, type ProposalContent } from '@/lib/clientPortal';
import { ProposalViewer } from '@/components/portal/ProposalSection';

export default function ProposalPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<ProposalContent | null | 'loading'>('loading');

  useEffect(() => {
    if (!slug) {
      setProposal(null);
      return;
    }
    const found = getProposalBySlug(slug);
    setProposal(found ?? null);
  }, [slug]);

  if (proposal === 'loading') return null;

  // ── Not found ────────────────────────────────────────────────────────────
  if (!proposal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5 px-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h1 className="text-xl font-black">Proposal Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This proposal link is invalid or has not been published yet.
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Proposal found ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/bitpopart-logo.svg"
              alt="BitPopArt"
              className="h-7 w-auto shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-muted-foreground text-sm hidden sm:inline">BitPopArt</span>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">
              {proposal.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-orange-500 text-white text-[10px] gap-1 hidden sm:flex">
              <FileText className="h-2.5 w-2.5" /> PR Proposal
            </Badge>
            {(proposal.type === 'pdf-url' || proposal.type === 'iframe-url') && (
              <a href={proposal.content} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <ExternalLink className="h-3 w-3" /> Open original
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-4">
          <h1 className="text-xl font-black">{proposal.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prepared by{' '}
            <a
              href="/"
              className="text-orange-500 hover:underline font-medium"
            >
              BitPopArt
            </a>
          </p>
        </div>

        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <ProposalViewer proposal={proposal} />
        </div>

        <footer className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <p>
            This proposal was prepared by{' '}
            <a href="/" className="text-orange-500 hover:underline font-medium">
              BitPopArt
            </a>
            . For questions, reach out directly.
          </p>
          <p className="opacity-50">
            Powered by{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Shakespeare
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

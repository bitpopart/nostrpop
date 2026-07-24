/**
 * ProposalPublicPage — publicly accessible at /proposal/:slug
 *
 * No login required. Anyone with the link can view the proposal.
 * Rendered inside the main site <Layout> so the full navigation header is shown.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Globe } from 'lucide-react';
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
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
              Back to site
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Proposal found ───────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-4">

      {/* Title row + Site button (top-right, like /app) */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black leading-tight">{proposal.title}</h1>
            <Badge className="bg-orange-500 text-white text-[10px] gap-1">
              <FileText className="h-2.5 w-2.5" /> PR Proposal
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Prepared by{' '}
            <a href="/" className="text-orange-500 hover:underline font-medium">
              BitPopArt
            </a>
          </p>
        </div>

        {/* Site button — top right, just like AppLayout */}
        <div className="flex items-center gap-2 shrink-0">
          {(proposal.type === 'pdf-url' || proposal.type === 'iframe-url') && (
            <a href={proposal.content} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Open original
              </Button>
            </a>
          )}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 rounded-full text-sm font-medium border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
          >
            <Link to="/" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Site
            </Link>
          </Button>
        </div>
      </div>

      {/* Proposal content — no wrapping box so iframe can grow to full content height */}
      <ProposalViewer proposal={proposal} />
    </div>
  );
}

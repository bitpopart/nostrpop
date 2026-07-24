/**
 * ProposalSection — shown inside a Client Portal page when the 'pr-proposal'
 * section is enabled.
 *
 * Admin mode  : edit the proposal (paste HTML, PDF URL, or iframe URL).
 * Client mode : read-only view of the proposal content.
 *
 * The proposal is also publicly accessible at /proposal/:slug (no login).
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, Link2, Code2, Save, Copy, Check, ExternalLink, Trash2,
} from 'lucide-react';
import {
  getProposalByPageId, upsertProposal, deleteProposal,
  type ProposalContent,
} from '@/lib/clientPortal';
import { useToast } from '@/hooks/useToast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposalSectionProps {
  pageId: string;
  slug: string;
  pageTitle: string;
  /** If true, show the admin editor. If false (default), show read-only view. */
  adminMode?: boolean;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <Button
      size="sm" variant="outline"
      className="h-7 text-xs gap-1.5"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        toast({ title: 'Copied!' });
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {label ?? 'Copy'}
    </Button>
  );
}

// ─── Admin editor ─────────────────────────────────────────────────────────────

function ProposalEditor({
  pageId, slug, pageTitle, proposal, onSaved,
}: {
  pageId: string;
  slug: string;
  pageTitle: string;
  proposal: ProposalContent | undefined;
  onSaved: (p: ProposalContent) => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'html' | 'pdf-url' | 'iframe-url'>(
    proposal?.type ?? 'html',
  );
  const [title, setTitle] = useState(proposal?.title ?? pageTitle + ' — Proposal');
  const [htmlContent, setHtmlContent] = useState(
    proposal?.type === 'html' ? proposal.content : '',
  );
  const [pdfUrl, setPdfUrl] = useState(
    proposal?.type === 'pdf-url' ? proposal.content : '',
  );
  const [iframeUrl, setIframeUrl] = useState(
    proposal?.type === 'iframe-url' ? proposal.content : '',
  );
  const [saving, setSaving] = useState(false);

  const publicUrl = `${window.location.origin}/proposal/${slug}`;

  const getContent = () => {
    if (tab === 'html') return htmlContent;
    if (tab === 'pdf-url') return pdfUrl;
    return iframeUrl;
  };

  const handleSave = () => {
    const content = getContent();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const saved = upsertProposal(pageId, slug, title.trim(), tab, content.trim());
      onSaved(saved);
      toast({ title: 'Proposal saved' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!proposal) return;
    if (!confirm('Delete this proposal? This cannot be undone.')) return;
    deleteProposal(proposal.id);
    onSaved({ ...proposal, content: '', type: 'html' });
    toast({ title: 'Proposal deleted' });
  };

  return (
    <div className="space-y-4">
      {/* Public link banner */}
      <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2 text-sm flex-wrap">
        <Link2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />
        <span className="text-muted-foreground text-xs">Public link (no login needed):</span>
        <span className="font-mono text-xs text-orange-600 truncate flex-1">{publicUrl}</span>
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton text={publicUrl} label="Copy link" />
          <a href={`/proposal/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <ExternalLink className="h-3.5 w-3.5 text-orange-500" />
            </Button>
          </a>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Proposal Title</label>
        <Input
          placeholder="e.g. BitPopArt — PR Proposal for Acme Corp"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Content type tabs */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Content</label>
        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="html" className="gap-1.5 text-xs">
              <Code2 className="h-3 w-3" /> Paste HTML
            </TabsTrigger>
            <TabsTrigger value="pdf-url" className="gap-1.5 text-xs">
              <FileText className="h-3 w-3" /> PDF URL
            </TabsTrigger>
            <TabsTrigger value="iframe-url" className="gap-1.5 text-xs">
              <Link2 className="h-3 w-3" /> Page / iFrame URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Paste the full HTML of your proposal page. You can export any webpage as HTML and paste it here.
            </p>
            <Textarea
              placeholder="<html><body>...</body></html>"
              value={htmlContent}
              onChange={e => setHtmlContent(e.target.value)}
              rows={10}
              className="font-mono text-xs resize-y"
            />
          </TabsContent>

          <TabsContent value="pdf-url" className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Enter a public URL to a PDF file. The PDF will be embedded directly on the proposal page.
            </p>
            <Input
              placeholder="https://example.com/proposal.pdf"
              value={pdfUrl}
              onChange={e => setPdfUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="iframe-url" className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Enter a URL to embed (e.g. a Google Slides, Notion page, or any public website).
            </p>
            <Input
              placeholder="https://docs.google.com/presentation/d/..."
              value={iframeUrl}
              onChange={e => setIframeUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-between flex-wrap">
        <div>
          {proposal && (
            <Button
              size="sm" variant="ghost"
              className="text-destructive hover:text-destructive gap-1.5 h-8 text-xs"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete proposal
            </Button>
          )}
        </div>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 h-8"
          onClick={handleSave}
          disabled={saving || !title.trim() || !getContent().trim()}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : proposal ? 'Update Proposal' : 'Save Proposal'}
        </Button>
      </div>
    </div>
  );
}

// ─── Proposal viewer (client-facing, also used on public page) ────────────────

export function ProposalViewer({ proposal }: { proposal: ProposalContent }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (proposal.type === 'html') {
    return (
      <iframe
        ref={iframeRef}
        srcDoc={proposal.content}
        title={proposal.title}
        className="w-full border-0 rounded-lg"
        style={{ minHeight: '70vh' }}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    );
  }

  if (proposal.type === 'pdf-url') {
    return (
      <div className="w-full" style={{ minHeight: '80vh' }}>
        <iframe
          src={`${proposal.content}#view=FitH`}
          title={proposal.title}
          className="w-full h-full border-0 rounded-lg"
          style={{ minHeight: '80vh' }}
        />
      </div>
    );
  }

  // iframe-url
  return (
    <iframe
      src={proposal.content}
      title={proposal.title}
      className="w-full border-0 rounded-lg"
      style={{ minHeight: '80vh' }}
      allow="fullscreen"
    />
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ProposalSection({ pageId, slug, pageTitle, adminMode = false }: ProposalSectionProps) {
  const [proposal, setProposal] = useState<ProposalContent | undefined>(undefined);

  useEffect(() => {
    setProposal(getProposalByPageId(pageId));
  }, [pageId]);

  const handleSaved = (p: ProposalContent) => {
    // If deleted, content will be empty — treat as no proposal
    setProposal(p.content ? p : undefined);
  };

  if (adminMode) {
    return (
      <Card className="border-orange-200 dark:border-orange-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            PR Proposal
            {proposal && (
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-300 dark:border-green-700 ml-1">
                Published
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalEditor
            pageId={pageId}
            slug={slug}
            pageTitle={pageTitle}
            proposal={proposal}
            onSaved={handleSaved}
          />
        </CardContent>
      </Card>
    );
  }

  // Client view (inside portal, requires login)
  if (!proposal) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center text-sm text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
          Proposal not available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">{proposal.title}</h2>
        <Badge className="bg-orange-500 text-white text-xs gap-1">
          <FileText className="h-3 w-3" /> PR Proposal
        </Badge>
      </div>
      <ProposalViewer proposal={proposal} />
    </div>
  );
}

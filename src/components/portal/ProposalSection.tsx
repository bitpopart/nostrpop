/**
 * ProposalSection — shown inside a Client Portal page when the 'pr-proposal'
 * section is enabled.
 *
 * Admin mode  : edit the proposal — upload an HTML file (same HtmlEditor as
 *               /pages), link a PDF URL, or embed an iframe URL.
 * Client mode : read-only view of the proposal content.
 *
 * The proposal is also publicly accessible at /proposal/:slug (no login).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, Link2, Code2, Save, Copy, Check, ExternalLink, Trash2,
  Upload, Loader2, FileCode,
} from 'lucide-react';
import {
  getProposalByPageId, upsertProposal, deleteProposal,
  type ProposalContent,
} from '@/lib/clientPortal';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { HtmlEditor } from '@/components/pages/HtmlEditor';
import { toast as sonnerToast } from 'sonner';

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
  const { mutateAsync: uploadFile } = useUploadFile();

  const [tab, setTab] = useState<'html' | 'pdf-url' | 'iframe-url'>(
    proposal?.type ?? 'html',
  );
  const [title, setTitle] = useState(proposal?.title ?? pageTitle + ' — Proposal');

  // HTML tab state
  const [htmlContent, setHtmlContent] = useState(
    proposal?.type === 'html' ? proposal.content : '',
  );

  // PDF / iframe tab state
  const [pdfUrl, setPdfUrl] = useState(
    proposal?.type === 'pdf-url' ? proposal.content : '',
  );
  const [iframeUrl, setIframeUrl] = useState(
    proposal?.type === 'iframe-url' ? proposal.content : '',
  );

  const [saving, setSaving] = useState(false);
  const htmlFileRef = useRef<HTMLInputElement>(null);

  const publicUrl = `${window.location.origin}/proposal/${slug}`;

  // ── Inject a tiny postMessage height reporter into the HTML ──────────────
  // This lets the parent page resize the iframe to the full content height
  // even after the file is hosted cross-origin on Blossom CDN.
  const injectHeightReporter = (html: string): string => {
    const script = `<script>
(function(){
  function report(){
    var h=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);
    window.parent.postMessage({type:'__proposal_height__',height:h},'*');
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',report);}else{report();}
  window.addEventListener('load',report);
  new MutationObserver(report).observe(document.documentElement,{subtree:true,childList:true,attributes:true});
})();
<\/script>`;
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, script + '</body>');
    if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, script + '</html>');
    return html + script;
  };

  // ── HTML file upload (reads file locally, no Blossom upload needed for preview)
  const handleHtmlFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const html = await file.text();
      setHtmlContent(html);
      sonnerToast.success('HTML file loaded — click "Save Proposal" to publish');
    } catch {
      sonnerToast.error('Failed to read file');
    } finally {
      if (htmlFileRef.current) htmlFileRef.current.value = '';
    }
  }, []);

  const getContent = () => {
    if (tab === 'html') return htmlContent;
    if (tab === 'pdf-url') return pdfUrl;
    return iframeUrl;
  };

  // ── Save: for HTML, upload to Blossom so public link works cross-device ──
  const handleSave = async () => {
    const content = getContent();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    try {
      let finalContent = content.trim();

      // For HTML proposals: upload to Blossom so the public /proposal/:slug
      // URL works on any device (not just the admin's browser).
      if (tab === 'html') {
        const uploadingId = sonnerToast.loading('Uploading HTML to Blossom…');
        try {
          // Inject height reporter so the viewer can resize the iframe to full
          // content height (no inner scrollbar) even from a cross-origin Blossom URL.
          const injected = injectHeightReporter(finalContent);
          const htmlBlob = new Blob([injected], { type: 'text/html' });
          const htmlFile = new File([htmlBlob], `proposal-${slug}.html`, { type: 'text/html' });
          const tags = await uploadFile(htmlFile);
          finalContent = tags[0][1]; // Blossom CDN URL
          sonnerToast.dismiss(uploadingId);

          // Switch to iframe-url type so the viewer loads from the CDN URL
          const saved = upsertProposal(pageId, slug, title.trim(), 'iframe-url', finalContent);
          onSaved(saved);
          toast({ title: 'Proposal saved & published!' });
        } catch {
          sonnerToast.dismiss(uploadingId);
          sonnerToast.error('Blossom upload failed — saving HTML locally as fallback');
          // Fall back: save raw HTML stored locally (only works on this device)
          const saved = upsertProposal(pageId, slug, title.trim(), 'html', content.trim());
          onSaved(saved);
          toast({ title: 'Proposal saved (local only)' });
        }
      } else {
        const saved = upsertProposal(pageId, slug, title.trim(), tab, finalContent);
        onSaved(saved);
        toast({ title: proposal ? 'Proposal updated' : 'Proposal saved' });
      }
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
          {/* Tab picker — same style as /pages */}
          <TabsList className="w-full h-auto p-1 grid grid-cols-3">
            <TabsTrigger value="html" className="flex flex-col items-center gap-1 py-2.5 h-auto">
              <FileCode className="h-3.5 w-3.5" />
              <span className="font-semibold text-xs">HTML Upload</span>
              <span className="text-[10px] font-normal opacity-70 leading-tight text-center hidden sm:block">Upload &amp; edit a custom HTML file</span>
            </TabsTrigger>
            <TabsTrigger value="pdf-url" className="flex flex-col items-center gap-1 py-2.5 h-auto">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-semibold text-xs">PDF URL</span>
              <span className="text-[10px] font-normal opacity-70 leading-tight text-center hidden sm:block">Link to a hosted PDF</span>
            </TabsTrigger>
            <TabsTrigger value="iframe-url" className="flex flex-col items-center gap-1 py-2.5 h-auto">
              <Link2 className="h-3.5 w-3.5" />
              <span className="font-semibold text-xs">Page / iFrame</span>
              <span className="text-[10px] font-normal opacity-70 leading-tight text-center hidden sm:block">Google Slides, Notion, etc.</span>
            </TabsTrigger>
          </TabsList>

          {/* ── HTML Upload tab ── */}
          <TabsContent value="html" className="mt-4 space-y-3">
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 px-3 py-2.5 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
              <FileCode className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Upload an <strong>.html</strong> file — your proposal page. The file will be hosted on Blossom so anyone with the public link can view it. You can also edit text, links, and images after uploading.
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={htmlFileRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={handleHtmlFileUpload}
            />

            {htmlContent ? (
              /* Show HtmlEditor once a file is loaded */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">HTML loaded — you can edit elements by clicking them in the preview.</span>
                  <Button
                    type="button" size="sm" variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => htmlFileRef.current?.click()}
                  >
                    <Upload className="h-3 w-3" /> Replace file
                  </Button>
                </div>
                <HtmlEditor
                  html={htmlContent}
                  onChange={setHtmlContent}
                  uploadFile={uploadFile}
                />
              </div>
            ) : (
              /* Drop zone */
              <div
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                onClick={() => htmlFileRef.current?.click()}
              >
                <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Click to upload your HTML file</p>
                  <p className="text-xs text-muted-foreground mt-1">Accepts .html and .htm files</p>
                </div>
                <Button type="button" variant="outline" className="gap-1.5">
                  <Upload className="h-4 w-4" /> Choose HTML file
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── PDF URL tab ── */}
          <TabsContent value="pdf-url" className="mt-4 space-y-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Enter a public URL to a PDF file. It will be embedded directly on the proposal page. Works with any publicly accessible PDF.</span>
            </div>
            <Input
              placeholder="https://example.com/proposal.pdf"
              value={pdfUrl}
              onChange={e => setPdfUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </TabsContent>

          {/* ── iFrame URL tab ── */}
          <TabsContent value="iframe-url" className="mt-4 space-y-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Code2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Enter a URL to embed — Google Slides, Notion, Canva, or any public page URL.</span>
            </div>
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
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Saving…' : proposal ? 'Update Proposal' : 'Save Proposal'}
        </Button>
      </div>
    </div>
  );
}

// ─── Auto-resizing iframe (no inner scrollbar) ───────────────────────────────
//
// Strategy:
//  • srcdoc (local HTML fallback): same-origin, read scrollHeight directly via
//    ResizeObserver → expand iframe to full content, page scroll only.
//  • Blossom-hosted HTML (cross-origin iframe-url): the HTML has a tiny
//    postMessage height reporter injected at upload time. Listen for that
//    message and resize accordingly.
//  • PDF / Google Slides / other cross-origin with no reporter: use a very
//    tall fixed height (10 000 px) so the iframe never clips content.
//    The page scroll handles everything; the iframe's own scroll is hidden.

function AutoIframe({
  src,
  srcDoc,
  title,
  sandbox,
  allow,
}: {
  src?: string;
  srcDoc?: string;
  title: string;
  sandbox?: string;
  allow?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Start with a large-enough placeholder; will be updated by measurement.
  const [height, setHeight] = useState<number>(800);

  // ── postMessage listener: Blossom-hosted HTML reports its own height ──
  useEffect(() => {
    if (!src) return; // srcdoc handled separately below
    const handler = (e: MessageEvent) => {
      if (
        e.data &&
        typeof e.data === 'object' &&
        e.data.type === '__proposal_height__' &&
        typeof e.data.height === 'number' &&
        e.data.height > 0
      ) {
        setHeight(e.data.height);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [src]);

  // ── onLoad: measure same-origin srcdoc content directly ──
  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const measure = () => {
      try {
        const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (!doc) return;
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
        );
        if (h > 0) setHeight(h);
      } catch { /* cross-origin — postMessage handler takes over */ }
    };
    measure();
    try {
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!doc) return;
      const ro = new ResizeObserver(measure);
      ro.observe(doc.documentElement);
      iframe.addEventListener('unload', () => ro.disconnect(), { once: true });
    } catch { /* cross-origin */ }
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      srcDoc={srcDoc}
      title={title}
      sandbox={sandbox}
      allow={allow}
      onLoad={handleLoad}
      className="w-full border-0 block"
      style={{ height, overflow: 'hidden' }}
      scrolling="no"
    />
  );
}

// ─── Proposal viewer (client-facing, also used on public page) ────────────────

export function ProposalViewer({ proposal }: { proposal: ProposalContent }) {
  if (proposal.type === 'html') {
    // Legacy: raw HTML stored locally (fallback when Blossom upload fails).
    // Same-origin srcdoc — AutoIframe measures height via ResizeObserver.
    return (
      <AutoIframe
        srcDoc={proposal.content}
        title={proposal.title}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    );
  }

  if (proposal.type === 'pdf-url') {
    // PDFs can't report their height; use a very tall iframe so nothing is
    // clipped and the page scrollbar handles all scrolling.
    return (
      <iframe
        src={`${proposal.content}#view=FitH&toolbar=1`}
        title={proposal.title}
        className="w-full border-0 block"
        style={{ height: '10000px', overflow: 'hidden' }}
        scrolling="no"
      />
    );
  }

  // iframe-url — Blossom-hosted HTML (injected with postMessage height reporter)
  // or any other URL. AutoIframe listens for the height message and resizes.
  return (
    <AutoIframe
      src={proposal.content}
      title={proposal.title}
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

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Code2, Eye, Upload, Link2, Type, Image as ImageIcon,
  Download, Loader2, Check, X, Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HtmlEditorProps {
  html: string;
  onChange: (html: string) => void;
  uploadFile: (file: File) => Promise<string[][]>;
}

type EditTarget =
  | { kind: 'text';     xpath: string; current: string; currentDownloadHref?: string }
  | { kind: 'link';     xpath: string; currentHref: string; currentText: string }
  | { kind: 'image';    xpath: string; currentSrc: string; currentAlt: string; currentDownloadHref?: string }
  | { kind: 'download'; xpath: string; currentHref: string; currentLabel: string };

// ─── XPath helpers ────────────────────────────────────────────────────────────

function resolveXPath(doc: Document, xpath: string): Element | null {
  try {
    const result = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue as Element | null;
  } catch {
    return null;
  }
}

// ─── Inject editing glue into iframe HTML ─────────────────────────────────────

const INJECTED_STYLE = `
<style id="__he_style__">
  [data-he-editable] { outline: 2px dashed transparent; transition: outline 0.15s; cursor: pointer; position: relative; }
  [data-he-editable]:hover { outline: 2px dashed #6366f1; }
  [data-he-editable]:hover::after {
    content: attr(data-he-label);
    position: absolute; top: -22px; left: 0;
    background: #6366f1; color: #fff;
    font-size: 10px; padding: 2px 6px; border-radius: 4px;
    white-space: nowrap; z-index: 99999; pointer-events: none;
  }
</style>
`;

const INJECTED_SCRIPT = `
<script id="__he_script__">
(function() {
  function annotate(doc) {
    var textTags = ['h1','h2','h3','h4','h5','h6','p','span','li','td','th','label','strong','em','small','b','i','u'];
    textTags.forEach(function(tag) {
      doc.querySelectorAll(tag).forEach(function(el) {
        if (el.children.length === 0 && el.textContent.trim()) {
          el.setAttribute('data-he-editable', 'text');
          el.setAttribute('data-he-label', '✏ Edit text / link');
        }
      });
    });
    doc.querySelectorAll('a').forEach(function(el) {
      var isDownload = el.hasAttribute('download') || (el.href && /\\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)$/i.test(el.href));
      if (isDownload) {
        el.setAttribute('data-he-editable', 'download');
        el.setAttribute('data-he-label', '⬇ Upload file');
      } else {
        el.setAttribute('data-he-editable', 'link');
        el.setAttribute('data-he-label', '🔗 Edit link');
      }
    });
    doc.querySelectorAll('img').forEach(function(el) {
      el.setAttribute('data-he-editable', 'image');
      el.setAttribute('data-he-label', '🖼 Edit image');
    });
    doc.querySelectorAll('button').forEach(function(el) {
      if (!el.closest('a')) {
        el.setAttribute('data-he-editable', 'text');
        el.setAttribute('data-he-label', '✏ Edit text / link');
      }
    });
  }

  function getXPath(el) {
    var parts = [];
    var node = el;
    while (node && node.tagName) {
      var tag = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      var siblings = Array.from(parent.children).filter(function(c){ return c.tagName === node.tagName; });
      var idx = siblings.indexOf(node) + 1;
      parts.unshift(siblings.length > 1 ? tag+'['+idx+']' : tag);
      node = parent;
    }
    return '//' + parts.join('/');
  }

  document.addEventListener('DOMContentLoaded', function() {
    annotate(document);
    document.addEventListener('click', function(e) {
      var target = e.target.closest('[data-he-editable]');
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      var kind = target.getAttribute('data-he-editable');
      var xpath = getXPath(target);
      // For text/image: check if wrapped in a download <a>
      var downloadHref = '';
      if (kind === 'text' || kind === 'image') {
        var parentA = target.closest('a');
        if (parentA && (parentA.hasAttribute('download') || parentA.getAttribute('href'))) {
          downloadHref = parentA.getAttribute('href') || '';
        }
      }
      window.parent.postMessage({
        type: '__he_click__',
        kind: kind,
        xpath: xpath,
        text: target.textContent,
        href: target.href || target.getAttribute('href') || '',
        src: target.src || target.getAttribute('src') || '',
        alt: target.alt || target.getAttribute('alt') || '',
        downloadHref: downloadHref,
      }, '*');
    });
  });
})();
</script>
`;

function injectEditing(html: string): string {
  let result = html;
  if (/<\/head>/i.test(result)) {
    result = result.replace(/<\/head>/i, `${INJECTED_STYLE}</head>`);
  } else {
    result = INJECTED_STYLE + result;
  }
  if (/<\/body>/i.test(result)) {
    result = result.replace(/<\/body>/i, `${INJECTED_SCRIPT}</body>`);
  } else {
    result = result + INJECTED_SCRIPT;
  }
  return result;
}

// ─── Apply edits back to raw HTML ─────────────────────────────────────────────

function applyEdit(html: string, target: EditTarget, values: Record<string, string>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const el = resolveXPath(doc, target.xpath);
  if (!el) return html;

  if (target.kind === 'text') {
    if (values.text !== undefined) el.textContent = values.text;
    // Handle wrapping/unwrapping in a download <a>
    if (values.downloadHref !== undefined) {
      const parentA = el.closest('a');
      if (values.downloadHref.trim()) {
        if (parentA) {
          parentA.setAttribute('href', values.downloadHref.trim());
          parentA.setAttribute('download', '');
        } else {
          const wrapper = doc.createElement('a');
          wrapper.href = values.downloadHref.trim();
          wrapper.setAttribute('download', '');
          wrapper.setAttribute('style', el.getAttribute('style') || '');
          el.parentNode!.insertBefore(wrapper, el);
          wrapper.appendChild(el);
        }
      } else if (parentA && parentA.hasAttribute('download')) {
        const parent = parentA.parentNode!;
        parent.insertBefore(el, parentA);
        parent.removeChild(parentA);
      }
    }
  } else if (target.kind === 'link') {
    if (values.href !== undefined) (el as HTMLAnchorElement).href = values.href;
    if (values.text !== undefined) el.textContent = values.text;
  } else if (target.kind === 'image') {
    if (values.src !== undefined) (el as HTMLImageElement).src = values.src;
    if (values.alt !== undefined) (el as HTMLImageElement).alt = values.alt;
    if (values.downloadHref !== undefined) {
      const parentA = el.closest('a');
      if (values.downloadHref.trim()) {
        if (parentA) {
          parentA.setAttribute('href', values.downloadHref.trim());
          parentA.setAttribute('download', '');
        } else {
          const wrapper = doc.createElement('a');
          wrapper.href = values.downloadHref.trim();
          wrapper.setAttribute('download', '');
          el.parentNode!.insertBefore(wrapper, el);
          wrapper.appendChild(el);
        }
      } else if (parentA && parentA.hasAttribute('download')) {
        const parent = parentA.parentNode!;
        parent.insertBefore(el, parentA);
        parent.removeChild(parentA);
      }
    }
  } else if (target.kind === 'download') {
    if (values.href !== undefined) {
      (el as HTMLAnchorElement).href = values.href;
      el.setAttribute('href', values.href);
    }
    if (values.text !== undefined) el.textContent = values.text;
  }

  const hasHtml = /<html/i.test(html);
  if (hasHtml) return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
  return doc.body.innerHTML;
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  target: EditTarget | null;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
  uploadFile: (file: File) => Promise<string[][]>;
}

function EditDialog({ target, onClose, onSave, uploadFile }: EditDialogProps) {
  const [text, setText] = useState('');
  const [href, setHref] = useState('');
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [downloadHref, setDownloadHref] = useState('');
  // For text and image: mode toggle between edit and download
  const [mode, setMode] = useState<'edit' | 'download'>('edit');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDownload, setIsUploadingDownload] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const downloadFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!target) return;
    if (target.kind === 'text') {
      setText(target.current);
      setDownloadHref(target.currentDownloadHref ?? '');
      setMode(target.currentDownloadHref ? 'download' : 'edit');
    }
    if (target.kind === 'link') { setHref(target.currentHref); setText(target.currentText); }
    if (target.kind === 'image') {
      setSrc(target.currentSrc); setAlt(target.currentAlt);
      setDownloadHref(target.currentDownloadHref ?? '');
      setMode(target.currentDownloadHref ? 'download' : 'edit');
    }
    if (target.kind === 'download') { setHref(target.currentHref); setText(target.currentLabel); }
  }, [target]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      setSrc(tags[0][1]);
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ''));
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setIsUploading(false); if (imageFileRef.current) imageFileRef.current.value = ''; }
  }, [alt, uploadFile]);

  const handleDownloadUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploadingDownload(true);
    try {
      const tags = await uploadFile(file);
      const url = tags[0][1];
      setDownloadHref(url);
      if (target?.kind === 'download') setHref(url);
      toast.success('File uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setIsUploadingDownload(false); if (downloadFileRef.current) downloadFileRef.current.value = ''; }
  }, [target, uploadFile]);

  const handleSave = () => {
    if (!target) return;
    if (target.kind === 'text')
      onSave({ text, downloadHref: mode === 'download' ? downloadHref : '' });
    else if (target.kind === 'link')
      onSave({ href, text });
    else if (target.kind === 'image')
      onSave({ src, alt, downloadHref: mode === 'download' ? downloadHref : '' });
    else if (target.kind === 'download')
      onSave({ href, text });
  };

  if (!target) return null;

  const isText     = target.kind === 'text';
  const isLink     = target.kind === 'link';
  const isImage    = target.kind === 'image';
  const isDownload = target.kind === 'download';
  const hasModeTabs = isText || isImage;

  const title =
    isText     ? 'Edit Text' :
    isLink     ? 'Edit Link' :
    isImage    ? 'Edit Image' :
    'Upload Downloadable File';

  const Icon = isText ? Type : isLink ? Link2 : isImage ? ImageIcon : Download;

  return (
    <Dialog open={!!target} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" /> {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* ── Mode toggle for text and image ── */}
          {hasModeTabs && (
            <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${
                  mode === 'edit' ? 'bg-indigo-600 text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                {isImage ? <><ImageIcon className="h-3.5 w-3.5" /> Replace image</> : <><Type className="h-3.5 w-3.5" /> Edit text</>}
              </button>
              <button
                type="button"
                onClick={() => setMode('download')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${
                  mode === 'download' ? 'bg-indigo-600 text-white' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <Download className="h-3.5 w-3.5" /> Make download {isImage ? 'button' : 'link'}
              </button>
            </div>
          )}

          {/* ── Text: edit mode ── */}
          {isText && mode === 'edit' && (
            <div className="space-y-1.5">
              <Label className="text-sm">Text content</Label>
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Enter text..." />
            </div>
          )}

          {/* ── Text: download mode ── */}
          {isText && mode === 'download' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm">Button / link label</Label>
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Download PDF" />
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                This text will become a clickable download link. Upload the file you want visitors to download.
              </p>
              <div className="space-y-1.5">
                <Label className="text-sm">Download file URL</Label>
                <Input
                  type="url"
                  value={downloadHref}
                  onChange={e => setDownloadHref(e.target.value)}
                  placeholder="https://... (auto-filled after upload)"
                />
              </div>
              {downloadHref && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{downloadHref}</span>
                </div>
              )}
              <input ref={downloadFileRef} type="file" className="hidden" onChange={handleDownloadUpload} />
              <Button type="button" variant="outline" className="w-full" onClick={() => downloadFileRef.current?.click()} disabled={isUploadingDownload}>
                {isUploadingDownload ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload file for download</>}
              </Button>
              {downloadHref && (
                <button type="button" className="text-xs text-red-500 hover:underline flex items-center gap-1" onClick={() => setDownloadHref('')}>
                  <X className="h-3 w-3" /> Remove download link
                </button>
              )}
            </>
          )}

          {/* ── Image: replace mode ── */}
          {isImage && mode === 'edit' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm">Image URL</Label>
                <Input type="url" value={src} onChange={e => setSrc(e.target.value)} placeholder="https://..." />
              </div>
              {src && <img src={src} alt={alt} className="w-full max-h-40 object-contain rounded border bg-muted" />}
              <div className="space-y-1.5">
                <Label className="text-sm">Alt text</Label>
                <Input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describe the image..." />
              </div>
              <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button type="button" variant="outline" className="w-full" onClick={() => imageFileRef.current?.click()} disabled={isUploading}>
                {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload new image</>}
              </Button>
            </>
          )}

          {/* ── Image: download mode ── */}
          {isImage && mode === 'download' && (
            <>
              {src && <img src={src} alt={alt} className="w-full max-h-32 object-contain rounded border bg-muted" />}
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                This image will become a clickable download button. Upload the file visitors will download when they click it.
              </p>
              <div className="space-y-1.5">
                <Label className="text-sm">Download file URL</Label>
                <Input type="url" value={downloadHref} onChange={e => setDownloadHref(e.target.value)} placeholder="https://... (auto-filled after upload)" />
              </div>
              {downloadHref && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{downloadHref}</span>
                </div>
              )}
              <input ref={downloadFileRef} type="file" className="hidden" onChange={handleDownloadUpload} />
              <Button type="button" variant="outline" className="w-full" onClick={() => downloadFileRef.current?.click()} disabled={isUploadingDownload}>
                {isUploadingDownload ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload file for download</>}
              </Button>
              {downloadHref && (
                <button type="button" className="text-xs text-red-500 hover:underline flex items-center gap-1" onClick={() => setDownloadHref('')}>
                  <X className="h-3 w-3" /> Remove download link
                </button>
              )}
            </>
          )}

          {/* ── Link ── */}
          {isLink && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm">Link label</Label>
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="Enter text..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Link URL</Label>
                <Input type="url" value={href} onChange={e => setHref(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {/* ── Download (non-image, non-text) ── */}
          {isDownload && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm">Button / link label</Label>
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="Enter text..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">File URL (auto-filled after upload)</Label>
                <Input type="url" value={href} onChange={e => setHref(e.target.value)} placeholder="https://..." />
              </div>
              {href && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{href}</span>
                </div>
              )}
              <input ref={downloadFileRef} type="file" className="hidden" onChange={handleDownloadUpload} />
              <Button type="button" variant="outline" className="w-full" onClick={() => downloadFileRef.current?.click()} disabled={isUploadingDownload}>
                {isUploadingDownload ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload file for download</>}
              </Button>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />Upload any file (PDF, ZIP, image, etc.) — it will be linked to this download button.
              </p>
            </>
          )}

        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Check className="h-4 w-4 mr-1.5" />Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main HtmlEditor ──────────────────────────────────────────────────────────

export function HtmlEditor({ html, onChange, uploadFile }: HtmlEditorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== '__he_click__') return;
      const { kind, xpath, text, href, src, alt, downloadHref } = e.data;
      if (kind === 'text')
        setEditTarget({ kind: 'text', xpath, current: text, currentDownloadHref: downloadHref || '' });
      else if (kind === 'link')
        setEditTarget({ kind: 'link', xpath, currentHref: href, currentText: text });
      else if (kind === 'image')
        setEditTarget({ kind: 'image', xpath, currentSrc: src, currentAlt: alt, currentDownloadHref: downloadHref || '' });
      else if (kind === 'download')
        setEditTarget({ kind: 'download', xpath, currentHref: href, currentLabel: text });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSaveEdit = useCallback((values: Record<string, string>) => {
    if (!editTarget) return;
    const updated = applyEdit(html, editTarget, values);
    onChange(updated);
    setEditTarget(null);
    toast.success('Change applied!');
  }, [html, editTarget, onChange]);

  const handleReplaceFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      onChange(text);
      toast.success('HTML file replaced');
    } catch { toast.error('Failed to read file'); }
    finally { if (codeUploadRef.current) codeUploadRef.current.value = ''; }
  }, [onChange]);

  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'visual' | 'code')}>
        {/* Tab bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <TabsList className="h-8">
            <TabsTrigger value="visual" className="h-7 text-xs gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Visual Editor
            </TabsTrigger>
            <TabsTrigger value="code" className="h-7 text-xs gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> HTML Code
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs hidden sm:flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" /> HTML loaded
            </Badge>
            <input ref={codeUploadRef} type="file" accept=".html,.htm" className="hidden" onChange={handleReplaceFile} />
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => codeUploadRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Replace file
            </Button>
          </div>
        </div>

        {/* Visual editor */}
        <TabsContent value="visual" className="m-0">
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border-b px-4 py-2 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Click any <strong>text</strong>, <strong>image</strong>, <strong>link</strong>, or <strong>button</strong> to edit it or make it a download link.</span>
          </div>
          <div style={{ height: '500px' }}>
            <iframe
              ref={iframeRef}
              srcDoc={injectEditing(html)}
              title="HTML Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms allow-popups"
            />
          </div>
          <div className="flex flex-wrap gap-3 px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Type className="h-3 w-3" /> Text</span>
            <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> Link</span>
            <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image</span>
            <span className="flex items-center gap-1"><Download className="h-3 w-3" /> Download</span>
            <span className="ml-auto opacity-60">Hover an element to see what's editable</span>
          </div>
        </TabsContent>

        {/* Code editor */}
        <TabsContent value="code" className="m-0">
          <div className="bg-amber-50 dark:bg-amber-900/10 border-b px-4 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Edit raw HTML directly. Changes sync instantly with the Visual tab.</span>
          </div>
          <Textarea
            value={html}
            onChange={e => onChange(e.target.value)}
            className="font-mono text-xs rounded-none border-0 focus-visible:ring-0 resize-none"
            style={{ height: '500px', minHeight: '500px' }}
            spellCheck={false}
          />
        </TabsContent>
      </Tabs>

      <EditDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        uploadFile={uploadFile}
      />
    </div>
  );
}

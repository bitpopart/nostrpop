/**
 * DesignSection — shown inside a ClientPortalPage.
 *
 * Admin view  : upload designs, edit title/description/version, delete, see all comments.
 * Client view : browse designs in a gallery, open full-size lightbox, leave comments.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Upload, Pencil, Trash2, X, Send, Loader2,
  MessageSquare, ChevronLeft, ChevronRight, ZoomIn,
  ImagePlus, Check, AlertCircle,
} from 'lucide-react';
import {
  getDesigns, saveDesign, deleteDesign, createDesign,
  getComments, addComment, deleteComment,
  type DesignItem, type DesignComment,
} from '@/lib/clientPortal';
import { useToast } from '@/hooks/useToast';
import { useIsAdmin } from '@/hooks/useIsAdmin';

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)  return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ms).toLocaleDateString();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// ─── Comment thread ────────────────────────────────────────────────────────────

function CommentThread({
  design,
  isAdmin,
  clientLabel,
}: {
  design: DesignItem;
  isAdmin: boolean;
  clientLabel: string;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState<DesignComment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setComments(getComments(design.id)), [design.id]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      addComment({
        designId: design.id,
        pageId:   design.pageId,
        author:      isAdmin ? 'admin' : 'client',
        authorLabel: isAdmin ? 'BitPopArt' : clientLabel,
        text: trimmed,
      });
      setText('');
      refresh();
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    deleteComment(id);
    refresh();
    toast({ title: 'Comment deleted' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
            No comments yet. Start the conversation!
          </div>
        )}
        {comments.map(c => {
          const isMine = isAdmin ? c.author === 'admin' : c.author === 'client';
          return (
            <div key={c.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar bubble */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5
                ${c.author === 'admin' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                {c.authorLabel.slice(0, 2).toUpperCase()}
              </div>
              <div className={`max-w-[75%] group relative ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words
                  ${isMine
                    ? 'bg-orange-500 text-white rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                  {c.text}
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className="text-[10px] text-muted-foreground">{c.authorLabel} · {timeAgo(c.createdAt)}</span>
                  {isAdmin && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border shrink-0">
        <Input
          placeholder="Add a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 text-sm"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Lightbox with comment panel ──────────────────────────────────────────────

function DesignLightbox({
  designs,
  startIndex,
  onClose,
  isAdmin,
  clientLabel,
}: {
  designs: DesignItem[];
  startIndex: number;
  onClose: () => void;
  isAdmin: boolean;
  clientLabel: string;
}) {
  const [idx, setIdx] = useState(startIndex);
  const design = designs[idx];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(designs.length - 1, i + 1));
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [designs.length, onClose]);

  if (!design) return null;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full max-h-[95vh] p-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm truncate">{design.title}</span>
            {design.version && (
              <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300 dark:border-orange-700 shrink-0">
                {design.version}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              {idx + 1} / {designs.length}
            </span>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body: image + comments side by side */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Image area */}
          <div className="flex-1 min-w-0 flex flex-col bg-black/5 dark:bg-black/30 relative">
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={design.imageUrl}
                alt={design.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Nav arrows */}
            {idx > 0 && (
              <button
                onClick={() => setIdx(i => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {idx < designs.length - 1 && (
              <button
                onClick={() => setIdx(i => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Description */}
            {design.description && (
              <div className="px-4 pb-3 shrink-0">
                <p className="text-xs text-muted-foreground">{design.description}</p>
              </div>
            )}
          </div>

          {/* Comment panel */}
          <div className="w-80 shrink-0 border-l border-border flex flex-col bg-background overflow-hidden">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <p className="text-sm font-bold flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-orange-500" /> Comments
              </p>
            </div>
            <div className="flex-1 min-h-0 p-3 flex flex-col overflow-hidden">
              <CommentThread design={design} isAdmin={isAdmin} clientLabel={clientLabel} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upload / Edit dialog (admin only) ────────────────────────────────────────

function DesignFormDialog({
  pageId,
  existing,
  onClose,
  onSaved,
}: {
  pageId: string;
  existing: DesignItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title:       existing?.title       ?? '',
    description: existing?.description ?? '',
    version:     existing?.version     ?? 'v1',
  });
  const [preview, setPreview]   = useState<string>(existing?.imageUrl ?? '');
  const [mimeType, setMimeType] = useState<string>(existing?.imageType ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Only image files are supported.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreview(dataUrl);
      setMimeType(file.type);
    } catch {
      setError('Failed to read file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!preview)            { setError('Please upload an image.'); return; }

    if (existing) {
      saveDesign({ ...existing, ...form, imageUrl: preview, imageType: mimeType, updatedAt: Date.now() });
      toast({ title: 'Design updated' });
    } else {
      createDesign({ pageId, ...form, imageUrl: preview, imageType: mimeType });
      toast({ title: 'Design uploaded!' });
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-orange-500" />
            {existing ? 'Edit Design' : 'Upload New Design'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl transition-colors cursor-pointer
              ${preview ? 'border-orange-300 dark:border-orange-700' : 'border-border hover:border-orange-400'}
              bg-muted/30 hover:bg-muted/50`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-xl" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                  <p className="text-white text-sm font-semibold">Click to replace</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                {uploading
                  ? <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  : <Upload className="h-8 w-8 opacity-40" />
                }
                <p className="text-sm font-medium">{uploading ? 'Reading…' : 'Click or drag to upload'}</p>
                <p className="text-xs">PNG, JPG, GIF, WebP, SVG — max 10 MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g. Homepage redesign"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Version</label>
              <Input
                placeholder="v1"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea
              placeholder="Notes for the client…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
            onClick={handleSave}
            disabled={uploading}
          >
            <Check className="h-4 w-4" />
            {existing ? 'Save Changes' : 'Upload Design'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Design card (gallery thumbnail) ─────────────────────────────────────────

function DesignCard({
  design,
  commentCount,
  onClick,
  isAdmin,
  onEdit,
  onDelete,
}: {
  design: DesignItem;
  commentCount: number;
  onClick: () => void;
  isAdmin: boolean;
  onEdit: (d: DesignItem) => void;
  onDelete: (d: DesignItem) => void;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200">
      {/* Image */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer"
        onClick={onClick}
      >
        <img
          src={design.imageUrl}
          alt={design.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
        {/* Version badge */}
        {design.version && (
          <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] shadow-md">
            {design.version}
          </Badge>
        )}
        {/* Comment count badge */}
        {commentCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1">
            <MessageSquare className="h-2.5 w-2.5" />
            {commentCount}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{design.title}</p>
            {design.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{design.description}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(design.updatedAt)}</p>
          </div>
          {/* Admin controls */}
          {isAdmin && (
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon" variant="ghost"
                className="h-7 w-7 hover:text-orange-500"
                onClick={e => { e.stopPropagation(); onEdit(design); }}
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-7 w-7 hover:text-destructive"
                onClick={e => { e.stopPropagation(); onDelete(design); }}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

interface DesignSectionProps {
  pageId: string;
  clientLabel?: string; // name shown in comments when client posts
}

export function DesignSection({ pageId, clientLabel = 'Client' }: DesignSectionProps) {
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // admin form
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DesignItem | null>(null);

  const refresh = useCallback(() => {
    const d = getDesigns(pageId).sort((a, b) => b.createdAt - a.createdAt);
    setDesigns(d);
    const counts: Record<string, number> = {};
    d.forEach(item => { counts[item.id] = getComments(item.id).length; });
    setCommentCounts(counts);
  }, [pageId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = (design: DesignItem) => {
    if (!confirm(`Delete "${design.title}"? This also removes all its comments.`)) return;
    deleteDesign(design.id);
    refresh();
    toast({ title: 'Design deleted' });
  };

  const openNew = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (d: DesignItem) => { setEditTarget(d); setFormOpen(true); };

  return (
    <div className="space-y-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-lg flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-orange-500" />
            Designs
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin
              ? 'Upload designs for your client to review and comment on.'
              : 'Review the designs below and leave your feedback.'}
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            onClick={openNew}
          >
            <Upload className="h-3.5 w-3.5" /> Upload Design
          </Button>
        )}
      </div>

      {/* Gallery */}
      {designs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ImagePlus className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              {isAdmin ? 'No designs uploaded yet.' : 'No designs shared yet.'}
            </p>
            {isAdmin && (
              <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={openNew}>
                <Upload className="h-3.5 w-3.5" /> Upload first design
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((d, i) => (
            <DesignCard
              key={d.id}
              design={d}
              commentCount={commentCounts[d.id] ?? 0}
              onClick={() => setLightboxIdx(i)}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <DesignLightbox
          designs={designs}
          startIndex={lightboxIdx}
          onClose={() => { setLightboxIdx(null); refresh(); }}
          isAdmin={isAdmin}
          clientLabel={clientLabel}
        />
      )}

      {/* Upload / Edit form */}
      {formOpen && (
        <DesignFormDialog
          pageId={pageId}
          existing={editTarget}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

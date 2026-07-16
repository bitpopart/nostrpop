import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  getPages, getCodes, getNpubs,
  createPage, savePage, deletePage,
  createCode, saveCode, deleteCode,
  createNpub, saveNpub, deleteNpub,
  type ClientPage, type AccessCode, type NpubEntry,
} from '@/lib/clientPortal';
import {
  Plus, Trash2, Copy, Check, RefreshCw, Key, Users,
  FileText, Link2, ToggleLeft, ToggleRight, ExternalLink,
  Eye, EyeOff,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

// ─── Available content sections you can assign to a portal page ───────────────
const AVAILABLE_SECTIONS = [
  { id: 'brand-guide', label: 'Brand Guide', desc: 'SVG logos, color palette, typography, UI components' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        toast({ title: 'Copied!' });
        setTimeout(() => setCopied(false), 1500);
      }}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ─── Pages tab ────────────────────────────────────────────────────────────────

function PagesTab() {
  const { toast } = useToast();
  const [pages, setPages] = useState<ClientPage[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientPage | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', sections: [] as string[], active: true });

  const refresh = useCallback(() => setPages(getPages().sort((a, b) => b.createdAt - a.createdAt)), []);
  useEffect(() => { refresh(); }, [refresh]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', slug: '', description: '', sections: [], active: true });
    setOpen(true);
  };

  const openEdit = (p: ClientPage) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, description: p.description, sections: [...p.sections], active: p.active });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    if (editing) {
      savePage({ ...editing, ...form });
    } else {
      createPage(form);
    }
    refresh();
    setOpen(false);
    toast({ title: editing ? 'Page updated' : 'Page created' });
  };

  const toggleActive = (p: ClientPage) => {
    savePage({ ...p, active: !p.active });
    refresh();
  };

  const handleDelete = (p: ClientPage) => {
    if (!confirm(`Delete page "${p.title}"? This cannot be undone.`)) return;
    deletePage(p.id);
    refresh();
    toast({ title: 'Page deleted' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Client pages are private pages you share with clients via a direct URL + login.</p>
        <Button size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" /> New Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
          No client pages yet. Create one to share with a client.
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(p => (
            <Card key={p.id} className={`border ${p.active ? 'border-orange-200 dark:border-orange-800/60' : 'border-border opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{p.title}</span>
                      <Badge variant={p.active ? 'default' : 'secondary'} className="text-[10px]">
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {p.sections.map(s => (
                        <Badge key={s} variant="outline" className="text-[10px] text-orange-600 border-orange-300 dark:border-orange-700">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <span>/client/{p.slug}</span>
                      <CopyButton text={`${window.location.origin}/client/${p.slug}`} />
                      <a href={`/client/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 ml-0.5 text-orange-500" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(p)} title={p.active ? 'Deactivate' : 'Activate'}>
                      {p.active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Page' : 'New Client Page'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Page Title</label>
              <Input
                placeholder="e.g. John Doe — Brand Guide"
                value={form.title}
                onChange={e => {
                  const t = e.target.value;
                  setForm(f => ({ ...f, title: t, slug: f.slug || slugify(t) }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL Slug</label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="shrink-0">/client/</span>
                <Input
                  placeholder="johndoe-brand"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(shown to client)</span></label>
              <Textarea
                placeholder="Brief note for the client…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Sections</label>
              <p className="text-xs text-muted-foreground">Select what the client can see on this page.</p>
              <div className="space-y-2">
                {AVAILABLE_SECTIONS.map(sec => (
                  <label key={sec.id} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.sections.includes(sec.id)}
                      onChange={e => {
                        setForm(f => ({
                          ...f,
                          sections: e.target.checked
                            ? [...f.sections, sec.id]
                            : f.sections.filter(s => s !== sec.id),
                        }));
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium group-hover:text-orange-500">{sec.label}</div>
                      <div className="text-xs text-muted-foreground">{sec.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              <span className="text-sm font-medium">Active (clients can access)</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={!form.title.trim() || !form.slug.trim()}
            >
              {editing ? 'Save Changes' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Codes tab ────────────────────────────────────────────────────────────────

function CodesTab() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [pages, setPages] = useState<ClientPage[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: '', pageIds: [] as string[], maxUses: 0 });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const refresh = useCallback(() => {
    setCodes(getCodes().sort((a, b) => b.createdAt - a.createdAt));
    setPages(getPages());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = () => {
    if (!form.label.trim() || form.pageIds.length === 0) return;
    const code = createCode(form.label, form.pageIds, form.maxUses);
    refresh();
    setOpen(false);
    toast({ title: `Code created: ${code.code}` });
  };

  const handleRevoke = (c: AccessCode) => {
    saveCode({ ...c, active: false });
    refresh();
    toast({ title: 'Code revoked' });
  };

  const handleDelete = (c: AccessCode) => {
    if (!confirm('Delete this code?')) return;
    deleteCode(c.id);
    refresh();
  };

  const regenerate = (c: AccessCode) => {
    // Create a fresh code with same settings
    createCode(c.label + ' (new)', c.pageIds, c.maxUses);
    refresh();
    toast({ title: 'New code generated' });
  };

  const shareUrl = (c: AccessCode): string => {
    const pages2 = pages.filter(p => c.pageIds.includes(p.id) && p.active);
    const slug = pages2[0]?.slug ?? '';
    const base = window.location.origin;
    return slug
      ? `${base}/login?redirect=/client/${slug}&code=${c.code}`
      : `${base}/login?code=${c.code}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Generate access codes to send to clients. Each code unlocks specific pages.</p>
        <Button size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { setForm({ label: '', pageIds: [], maxUses: 0 }); setOpen(true); }}>
          <Key className="h-3.5 w-3.5" /> Generate Code
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
          No codes yet. Generate one to give a client access.
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map(c => {
            const pageLabels = pages.filter(p => c.pageIds.includes(p.id)).map(p => p.title);
            const isRevealed = revealed[c.id];
            return (
              <Card key={c.id} className={`border ${c.active ? 'border-orange-200 dark:border-orange-800/60' : 'border-border opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{c.label}</span>
                        <Badge variant={c.active ? 'default' : 'secondary'} className="text-[10px]">
                          {c.active ? 'Active' : 'Revoked'}
                        </Badge>
                        {c.maxUses > 0 && (
                          <Badge variant="outline" className="text-[10px]">{c.usedCount}/{c.maxUses} uses</Badge>
                        )}
                        {c.maxUses === 0 && c.usedCount > 0 && (
                          <Badge variant="outline" className="text-[10px]">{c.usedCount} uses</Badge>
                        )}
                      </div>

                      {/* Code display */}
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-lg font-black tracking-widest text-orange-500 ${!isRevealed ? 'blur-sm select-none' : ''}`}>
                          {c.code}
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRevealed(r => ({ ...r, [c.id]: !r[c.id] }))}>
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        {isRevealed && <CopyButton text={c.code} />}
                      </div>

                      {/* Pages */}
                      <div className="flex flex-wrap gap-1">
                        {pageLabels.map(l => (
                          <Badge key={l} variant="outline" className="text-[10px] text-orange-600 border-orange-300 dark:border-orange-700">{l}</Badge>
                        ))}
                      </div>

                      {/* Share link */}
                      {c.active && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span className="truncate font-mono text-[10px]">{shareUrl(c)}</span>
                          <CopyButton text={shareUrl(c)} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {c.active && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleRevoke(c)}>
                          Revoke
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => regenerate(c)} title="Clone with new code">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Access Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Label <span className="text-muted-foreground font-normal">(your reference)</span></label>
              <Input placeholder="e.g. John Doe — Brand Review" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pages this code unlocks</label>
              {pages.length === 0 ? (
                <p className="text-xs text-destructive">Create a client page first.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pages.filter(p => p.active).map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.pageIds.includes(p.id)}
                        onChange={e => setForm(f => ({
                          ...f,
                          pageIds: e.target.checked ? [...f.pageIds, p.id] : f.pageIds.filter(id => id !== p.id),
                        }))}
                      />
                      <span className="text-sm">{p.title}</span>
                      <span className="text-xs text-muted-foreground font-mono">/client/{p.slug}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max uses <span className="text-muted-foreground font-normal">(0 = unlimited)</span></label>
              <Input type="number" min={0} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} className="w-28" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
              onClick={handleCreate}
              disabled={!form.label.trim() || form.pageIds.length === 0}
            >
              <Key className="h-3.5 w-3.5" /> Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Npub tab ─────────────────────────────────────────────────────────────────

function NpubTab() {
  const { toast } = useToast();
  const [npubs, setNpubs] = useState<NpubEntry[]>([]);
  const [pages, setPages] = useState<ClientPage[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ npub: '', label: '', pageIds: [] as string[] });

  const refresh = useCallback(() => {
    setNpubs(getNpubs().sort((a, b) => b.createdAt - a.createdAt));
    setPages(getPages());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = () => {
    if (!form.npub.trim() || !form.label.trim() || form.pageIds.length === 0) return;
    if (!form.npub.startsWith('npub1')) {
      toast({ title: 'Invalid npub', description: 'Must start with npub1', variant: 'destructive' });
      return;
    }
    createNpub(form.npub, form.label, form.pageIds);
    refresh();
    setOpen(false);
    toast({ title: 'Npub whitelisted' });
  };

  const toggleActive = (n: NpubEntry) => {
    saveNpub({ ...n, active: !n.active });
    refresh();
  };

  const handleDelete = (n: NpubEntry) => {
    if (!confirm('Remove this npub from the whitelist?')) return;
    deleteNpub(n.id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Whitelist Nostr public keys. Clients with these npubs can log in without a code.</p>
        <Button size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { setForm({ npub: '', label: '', pageIds: [] }); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Npub
        </Button>
      </div>

      {npubs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
          No whitelisted npubs yet.
        </div>
      ) : (
        <div className="space-y-3">
          {npubs.map(n => {
            const pageLabels = pages.filter(p => n.pageIds.includes(p.id)).map(p => p.title);
            return (
              <Card key={n.id} className={`border ${n.active ? 'border-orange-200 dark:border-orange-800/60' : 'border-border opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{n.label}</span>
                        <Badge variant={n.active ? 'default' : 'secondary'} className="text-[10px]">
                          {n.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-xs">{n.npub}</span>
                        <CopyButton text={n.npub} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {pageLabels.map(l => (
                          <Badge key={l} variant="outline" className="text-[10px] text-orange-600 border-orange-300 dark:border-orange-700">{l}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(n)}>
                        {n.active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(n)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Npub to Whitelist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Label</label>
              <Input placeholder="e.g. John Doe" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nostr Public Key (npub1…)</label>
              <Input placeholder="npub1…" value={form.npub} onChange={e => setForm(f => ({ ...f, npub: e.target.value.trim() }))} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pages this npub can access</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {pages.filter(p => p.active).map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.pageIds.includes(p.id)}
                      onChange={e => setForm(f => ({
                        ...f,
                        pageIds: e.target.checked ? [...f.pageIds, p.id] : f.pageIds.filter(id => id !== p.id),
                      }))}
                    />
                    <span className="text-sm">{p.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleCreate}
              disabled={!form.npub.trim() || !form.label.trim() || form.pageIds.length === 0}
            >
              Add to Whitelist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ClientPortalAdmin() {
  return (
    <div className="space-y-4">
      <Card className="border-orange-200 dark:border-orange-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Client Portal
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create private pages for clients, generate access codes, and manage Nostr npub whitelist.
            Clients access their pages at <span className="font-mono text-orange-500">/client/:slug</span> after logging in at <span className="font-mono text-orange-500">/login</span>.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pages">
            <TabsList className="mb-4">
              <TabsTrigger value="pages" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Pages</TabsTrigger>
              <TabsTrigger value="codes" className="gap-1.5"><Key className="h-3.5 w-3.5" />Access Codes</TabsTrigger>
              <TabsTrigger value="npubs" className="gap-1.5"><Users className="h-3.5 w-3.5" />Npub Whitelist</TabsTrigger>
            </TabsList>
            <TabsContent value="pages"><PagesTab /></TabsContent>
            <TabsContent value="codes"><CodesTab /></TabsContent>
            <TabsContent value="npubs"><NpubTab /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

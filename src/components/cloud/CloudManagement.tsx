/**
 * CloudManagement — Admin UI for the /admin → Cloud tab.
 *
 * SECURITY: HTML is AES-256-GCM encrypted in-browser and stored as base64
 * in IndexedDB (large quota). Nothing is ever uploaded to a public server.
 * Cross-browser access: export a .bpcloud backup file and import on other browser.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadCloudApps, saveCloudApps, makeCloudAppId,
  saveEncryptedAppData, loadEncryptedAppData, loadEncryptedAppDataSync,
  deleteEncryptedAppData,
  cacheCloudAppHtml, deleteCachedCloudAppHtml, clearAllCloudAppCaches,
  getCloudIDBUsageBytes, migrateCloudDataToIDB,
  loadCloudUsers, saveCloudUsers, createCloudUser,
  formatBytes,
  type CloudApp, type CloudUser,
} from '@/lib/cloudTypes';
import {
  encryptToB64, decryptFromB64,
  exportMasterKeyB64, importMasterKeyB64, hasMasterKey,
  bytesToBase64, base64ToBytes,
} from '@/lib/cloudCrypto';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, X, Upload, Trash2, Loader2, Cloud, Users,
  FileCode, Eye, EyeOff, MoveUp, MoveDown, KeyRound, User,
  ImageIcon, Pencil, Check, AlertTriangle, Lock, ShieldCheck,
  Copy, Download, RefreshCw, ExternalLink, HardDrive, PackageOpen,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((a, i) => ({ ...a, order: i + 1 }));
}

// ─── Key Manager ─────────────────────────────────────────────────────────────

function KeyManager() {
  const [exportedKey, setExportedKey] = useState('');
  const [importValue, setImportValue] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const b64 = await exportMasterKeyB64();
      setExportedKey(b64);
      setShowKey(true);
    } catch { toast.error('Failed to export key'); }
    finally { setLoading(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportedKey);
    toast.success('Key copied to clipboard');
  };

  const handleImport = async () => {
    if (!importValue.trim()) { toast.error('Paste your key first'); return; }
    setLoading(true);
    try {
      await importMasterKeyB64(importValue.trim());
      toast.success('Master key imported successfully');
      setImportValue(''); setShowImport(false);
    } catch (e) { toast.error('Invalid key: ' + String(e)); }
    finally { setLoading(false); }
  };

  return (
    <Card className="border-violet-200 bg-violet-50 dark:bg-violet-900/10 dark:border-violet-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-600" />
          Encryption Key
        </CardTitle>
        <CardDescription className="text-xs">
          Your master key encrypts all Cloud apps. Export it to use Cloud apps on another browser.
          {!hasMasterKey() && (
            <span className="block mt-1 text-amber-600 font-semibold">
              ⚠️ No key yet — one is generated automatically when you add your first app.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}
          className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30">
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
          Export Master Key
        </Button>

        {exportedKey && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <code className="flex-1 block text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1.5 font-mono break-all truncate">
                {showKey ? exportedKey : '••••••••••••••••••••••••••••••••••••••••••••••'}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowKey(v => !v)}>
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Save this somewhere safe. Without it you cannot decrypt your apps on another browser.</p>
          </div>
        )}

        <div className="border-t pt-3">
          {!showImport ? (
            <Button variant="ghost" size="sm" onClick={() => setShowImport(true)} className="text-violet-600 hover:text-violet-700">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Import key from another browser
            </Button>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Paste master key (base64)</Label>
              <Input value={importValue} onChange={e => setImportValue(e.target.value)}
                placeholder="Paste your exported key here…" className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImport} disabled={loading}>Import</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowImport(false); setImportValue(''); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Storage Usage ────────────────────────────────────────────────────────────

function StorageUsageBar({ onClearCaches }: { onClearCaches: () => Promise<void> }) {
  const [usage, setUsage] = useState<{ enc: number; cache: number } | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    getCloudIDBUsageBytes().then(setUsage).catch(() => null);
  }, []);

  const handleClear = async () => {
    setClearing(true);
    await onClearCaches();
    const fresh = await getCloudIDBUsageBytes().catch(() => null);
    setUsage(fresh);
    setClearing(false);
  };

  if (!usage) return null;

  const total = usage.enc + usage.cache;

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-1.5">
            <Database className="h-4 w-4 text-slate-500" /> IndexedDB storage (Cloud apps)
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatBytes(total)} used
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>🔒 Encrypted apps: <strong>{formatBytes(usage.enc)}</strong></span>
            {usage.cache > 0 && <span>📄 Plaintext cache: <strong>{formatBytes(usage.cache)}</strong></span>}
          </div>
          {usage.cache > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear} disabled={clearing}
              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              {clearing
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Clearing…</>
                : <><Trash2 className="h-3 w-3 mr-1" /> Clear caches ({formatBytes(usage.cache)})</>}
            </Button>
          )}
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          <Database className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
          <span>Stored in IndexedDB — capacity is hundreds of MB (no more 5 MB limit).</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── App Form ─────────────────────────────────────────────────────────────────

interface AppFormProps {
  initial?: CloudApp;
  onSave: (app: CloudApp, html: string) => void;
  onCancel: () => void;
  uploadFile: (f: File) => Promise<string[][]>;
}

function AppForm({ initial, onSave, onCancel, uploadFile }: AppFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [htmlLoading, setHtmlLoading] = useState(!!initial?.id);
  const [htmlFileName, setHtmlFileName] = useState('');
  const htmlRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  // Load cached HTML for editing
  useEffect(() => {
    if (!initial?.id) return;
    loadCachedCloudAppHtml(initial.id)
      .then(html => { if (html) setHtmlContent(html); })
      .catch(() => null)
      .finally(() => setHtmlLoading(false));
  }, [initial?.id]);

  const handleHtmlPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setHtmlContent(ev.target?.result as string); setHtmlFileName(file.name); };
    reader.readAsText(file);
    if (htmlRef.current) htmlRef.current.value = '';
  }, []);

  const handleThumbUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const tags = await uploadFile(file);
      setThumbnailUrl(tags[0][1]);
      toast.success('Thumbnail uploaded');
    } catch { toast.error('Failed to upload thumbnail'); }
    finally { setUploadingThumb(false); if (thumbRef.current) thumbRef.current.value = ''; }
  }, [uploadFile]);

  const handleSave = () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    if (!htmlContent.trim()) { toast.error('Please select an HTML file'); return; }
    const app: CloudApp = {
      id: initial?.id ?? makeCloudAppId(title),
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      order: initial?.order,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      htmlSize: new Blob([htmlContent]).size,
    };
    onSave(app, htmlContent);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 px-4 py-3 text-xs text-green-800 dark:text-green-300">
        <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600" />
        <span><strong>AES-256-GCM encrypted.</strong> Your HTML is encrypted in-browser and stored in IndexedDB — never uploaded to any public server.</span>
      </div>

      <div className="space-y-1.5">
        <Label>App Title *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome App" />
      </div>

      <div className="space-y-1.5">
        <Label>Short Description (optional)</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this app do?" />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <FileCode className="h-4 w-4 text-purple-500" /> HTML File *
          <span className="text-xs font-normal text-muted-foreground ml-1">(encrypted + stored in IndexedDB)</span>
        </Label>
        <input ref={htmlRef} type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlPick} />
        {htmlLoading ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800/30">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span className="text-xs text-muted-foreground">Loading existing HTML…</span>
          </div>
        ) : htmlContent ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-green-700 dark:text-green-400 font-medium text-xs truncate">
                {htmlFileName || (initial?.id ? `${initial.id}.html (existing)` : 'HTML loaded')}
              </p>
              <p className="text-green-600/70 text-xs">{formatBytes(new Blob([htmlContent]).size)} · AES-256-GCM encrypted</p>
            </div>
            <button type="button" onClick={() => { setHtmlContent(''); setHtmlFileName(''); }} className="text-green-500 hover:text-red-500 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors" onClick={() => htmlRef.current?.click()}>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Upload className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Click to choose your HTML file</p>
              <p className="text-xs text-muted-foreground mt-1">Encrypted in-browser · stored in IndexedDB · no server upload</p>
            </div>
            <Button type="button" variant="outline" size="sm"><FileCode className="h-4 w-4 mr-2" /> Choose .html file</Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-blue-500" /> Thumbnail Image (optional)
          <span className="text-xs font-normal text-muted-foreground ml-1">(preview only — public OK)</span>
        </Label>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
        {thumbnailUrl ? (
          <div className="relative rounded-lg overflow-hidden aspect-video w-48 border">
            <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setThumbnailUrl('')} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-600/80 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()} disabled={uploadingThumb}>
              {uploadingThumb ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</> : <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload thumbnail</>}
            </Button>
            <Input type="url" placeholder="Or paste image URL" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">If omitted, a coloured gradient is used.</p>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={handleSave}>{initial ? 'Update App' : 'Add App'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────

function BackupRestore({ apps }: { apps: CloudApp[] }) {
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    if (apps.length === 0) { toast.error('No apps to export'); return; }
    const tid = toast.loading('Preparing backup…');
    try {
      const masterKey = await exportMasterKeyB64();
      const appData: Record<string, string> = {};
      for (const app of apps) {
        const enc = await loadEncryptedAppData(app.id);
        if (enc) appData[app.id] = enc;
      }
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        masterKey,
        apps,
        appData,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bitpopart-cloud-backup-${Date.now()}.bpcloud`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded', { id: tid });
    } catch (e) { toast.error('Export failed: ' + String(e), { id: tid }); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const tid = toast.loading('Importing backup…');
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.version || !backup.masterKey || !backup.apps) throw new Error('Invalid backup file');

      // Import master key
      await importMasterKeyB64(backup.masterKey);

      // Import app metadata
      const existing = loadCloudApps();
      const existingIds = new Set(existing.map((a: CloudApp) => a.id));
      const newApps = (backup.apps as CloudApp[]).filter(a => !existingIds.has(a.id));
      saveCloudApps([...existing, ...newApps].map((a, i) => ({ ...a, order: a.order ?? i + 1 })));

      // Import encrypted data into IndexedDB
      let count = 0;
      let failed = 0;
      for (const [appId, enc] of Object.entries(backup.appData ?? {})) {
        const ok = await saveEncryptedAppData(appId, enc as string);
        if (ok) { count++; } else { failed++; }
      }

      const msg = failed > 0
        ? `Imported ${newApps.length} app(s) · ${count} files stored · ${failed} failed`
        : `Imported ${newApps.length} app(s) with ${count} encrypted file(s)`;
      toast.success(msg, { id: tid });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      toast.error('Import failed: ' + String(e), { id: tid });
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-blue-600" />
          Backup &amp; Restore
        </CardTitle>
        <CardDescription className="text-xs">
          Export a <code>.bpcloud</code> file to transfer all apps (including encrypted data + master key) to another browser or device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30">
          <Download className="h-3.5 w-3.5 mr-2" /> Export .bpcloud backup
        </Button>
        <input ref={importRef} type="file" accept=".bpcloud,.json" className="hidden" onChange={handleImport} />
        <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} disabled={importing}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30">
          {importing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <PackageOpen className="h-3.5 w-3.5 mr-2" />}
          Import .bpcloud backup
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Apps Section ─────────────────────────────────────────────────────────────

function CloudAppsSection() {
  const { mutateAsync: uploadFile } = useUploadFile();
  const navigate = useNavigate();
  const [apps, setApps] = useState<CloudApp[]>(() => loadCloudApps());
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<CloudApp | null>(null);
  const [storageVersion, setStorageVersion] = useState(0);

  // Run one-time migration from localStorage → IndexedDB
  useEffect(() => {
    const ids = loadCloudApps().map(a => a.id);
    migrateCloudDataToIDB(ids).catch(() => null);
  }, []);

  const persist = (next: CloudApp[]) => {
    const ordered = next.map((a, i) => ({ ...a, order: i + 1 }));
    saveCloudApps(ordered);
    setApps(ordered);
    setStorageVersion(v => v + 1);
  };

  const handleClearCaches = useCallback(async () => {
    const cleared = await clearAllCloudAppCaches();
    setStorageVersion(v => v + 1);
    toast.success(cleared > 0 ? `Cleared plaintext caches for ${cleared} app(s)` : 'No caches to clear');
  }, []);

  const handleSave = async (app: CloudApp, html: string) => {
    const tid = toast.loading('Encrypting…');
    try {
      const b64 = await encryptToB64(html);

      const ok = await saveEncryptedAppData(app.id, b64);
      if (!ok) {
        toast.error('Failed to save — IndexedDB write error. Check browser storage permissions.', { id: tid });
        return;
      }

      // Set flag so list can show "stored" badge without an extra async lookup
      localStorage.setItem(`bitpopart:cloud:enc-flag:${app.id}`, '1');

      // Cache plaintext for instant open (non-fatal if it fails)
      await cacheCloudAppHtml(app.id, html).catch(() => null);

      if (editingApp) {
        persist(apps.map(a => a.id === app.id ? app : a));
        toast.success('App updated & re-encrypted', { id: tid });
      } else {
        persist([...apps, { ...app, order: apps.length + 1 }]);
        toast.success('App encrypted & saved ✓', { id: tid });
      }
      setIsCreating(false);
      setEditingApp(null);
    } catch (e) {
      toast.error('Failed: ' + String(e).slice(0, 100), { id: tid });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this app? This cannot be undone.')) return;
    await deleteEncryptedAppData(id);
    await deleteCachedCloudAppHtml(id);
    persist(apps.filter(a => a.id !== id));
    toast.success('App removed');
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= apps.length) return;
    persist(reorder(apps, index, to));
  };

  return (
    <div className="space-y-6">
      <KeyManager />
      <StorageUsageBar key={storageVersion} onClearCaches={handleClearCaches} />
      <BackupRestore apps={apps} />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-purple-600" /> Cloud Apps
              </CardTitle>
              <CardDescription>
                HTML apps are <strong>AES-256-GCM encrypted</strong> and stored in IndexedDB — no server upload, no 5 MB limit.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" onClick={() => window.open('/cloud', '_blank')}
                className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/20">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Cloud ↗
              </Button>
              {!isCreating && !editingApp && (
                <Button onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 mr-2" /> Add App</Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {(isCreating || editingApp) && (
        <Card>
          <CardHeader><CardTitle>{editingApp ? 'Edit App' : 'Add New App'}</CardTitle></CardHeader>
          <CardContent>
            <AppForm
              initial={editingApp ?? undefined}
              onSave={handleSave}
              onCancel={() => { setIsCreating(false); setEditingApp(null); }}
              uploadFile={uploadFile}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Existing Apps ({apps.length})</CardTitle></CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Cloud className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No Cloud apps yet. Add your first app above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app, index) => {
                // Use synchronous flag for UI (avoids async in render)
                const hasData = loadEncryptedAppDataSync(app.id);
                return (
                  <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/40 transition-colors">
                    {app.thumbnailUrl ? (
                      <img src={app.thumbnailUrl} alt={app.title} className="w-20 h-14 object-cover rounded-lg shrink-0 border" />
                    ) : (
                      <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                        <FileCode className="h-6 w-6 text-white/70" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{app.title}</p>
                      {app.description && <p className="text-xs text-muted-foreground truncate">{app.description}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-400">
                          <Lock className="h-2.5 w-2.5 mr-1" /> AES-256-GCM
                        </Badge>
                        {hasData
                          ? <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-400"><Database className="h-2.5 w-2.5 mr-1" />IndexedDB</Badge>
                          : <Badge variant="outline" className="text-xs border-red-300 text-red-600"><AlertTriangle className="h-2.5 w-2.5 mr-1" />Missing data</Badge>
                        }
                        {app.htmlSize && <Badge variant="secondary" className="text-xs">{formatBytes(app.htmlSize)}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => handleMove(index, -1)} title="Move up"><MoveUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === apps.length - 1} onClick={() => handleMove(index, 1)} title="Move down"><MoveDown className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditingApp(app); setIsCreating(false); }} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(app.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Users Section ────────────────────────────────────────────────────────────

function CloudUsersSection() {
  const [users, setUsers] = useState<CloudUser[]>(() => loadCloudUsers());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const persist = (next: CloudUser[]) => { saveCloudUsers(next); setUsers(next); };

  const handleAdd = () => {
    if (!newName.trim()) { toast.error('Please enter a name'); return; }
    if (newPassword.length < 4) { toast.error('Password must be at least 4 characters'); return; }
    const user = createCloudUser(newName.trim(), newPassword);
    if (users.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) { toast.error('A user with that name already exists'); return; }
    persist([...users, user]);
    toast.success(`User "${user.name}" created — login ID: ${user.id}`);
    setNewName(''); setNewPassword(''); setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this Cloud user?')) return;
    persist(users.filter(u => u.id !== id));
    toast.success('User deleted');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /> Cloud Users</CardTitle>
              <CardDescription>Create login credentials. Share the <strong>Username (ID)</strong> and password.</CardDescription>
            </div>
            {!isCreating && <Button onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 mr-2" /> Add User</Button>}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Local-only credentials</p>
            <p>Credentials are stored in this browser's localStorage. Share only with trusted people.</p>
          </div>
        </CardContent>
      </Card>

      {isCreating && (
        <Card>
          <CardHeader><CardTitle>New Cloud User</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><User className="h-4 w-4" /> Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Johannes" />
              <p className="text-xs text-muted-foreground">Login ID is auto-generated from this name.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Password</Label>
              <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 4 characters" />
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleAdd}>Create User</Button>
              <Button variant="ghost" onClick={() => { setIsCreating(false); setNewName(''); setNewPassword(''); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Existing Users ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No Cloud users yet.</p></div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{user.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">ID: {user.id}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>PW:</span>
                        <span className="font-mono">{showPasswords[user.id] ? user.password : '••••••••'}</span>
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [user.id]: !p[user.id] }))} className="text-blue-500 hover:text-blue-700 ml-1">
                          {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 shrink-0" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CloudManagement() {
  return (
    <Tabs defaultValue="apps">
      <TabsList className="mb-6">
        <TabsTrigger value="apps" className="flex items-center gap-2"><Cloud className="h-4 w-4" /> Apps</TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
      </TabsList>
      <TabsContent value="apps"><CloudAppsSection /></TabsContent>
      <TabsContent value="users"><CloudUsersSection /></TabsContent>
    </Tabs>
  );
}

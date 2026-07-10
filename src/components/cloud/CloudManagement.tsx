/**
 * CloudManagement — Admin UI for the /admin → Cloud tab.
 *
 * SECURITY: HTML is AES-256-GCM encrypted in-browser before upload.
 * The CDN receives only ciphertext — unreadable without the master key
 * that lives exclusively in localStorage.
 */

import { useState, useRef, useCallback } from 'react';
import {
  loadCloudApps,
  saveCloudApps,
  makeCloudAppId,
  cacheCloudAppHtml,
  loadCachedCloudAppHtml,
  deleteCachedCloudAppHtml,
  loadCloudUsers,
  saveCloudUsers,
  createCloudUser,
  formatBytes,
  type CloudApp,
  type CloudUser,
} from '@/lib/cloudTypes';
import {
  encryptText,
  exportMasterKeyB64,
  importMasterKeyB64,
  hasMasterKey,
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
  Copy, Download, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((a, i) => ({ ...a, order: i + 1 }));
}

// ─── Key Manager panel ────────────────────────────────────────────────────────

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
      toast.success('Master key imported — apps encrypted with this key are now accessible');
      setImportValue('');
      setShowImport(false);
    } catch (e) {
      toast.error('Invalid key: ' + String(e));
    } finally { setLoading(false); }
  };

  return (
    <Card className="border-violet-200 bg-violet-50 dark:bg-violet-900/10 dark:border-violet-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-600" />
          Encryption Key Management
        </CardTitle>
        <CardDescription className="text-xs">
          Your master key encrypts all Cloud apps. Export it to use Cloud apps from another browser or device.
          {!hasMasterKey() && (
            <span className="block mt-1 text-amber-600 font-semibold">
              ⚠️ No key yet — one will be generated automatically when you add your first app.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Export */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
            className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30"
          >
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
              <p className="text-xs text-muted-foreground">
                Save this key somewhere safe. Without it, encrypted apps cannot be decrypted.
              </p>
            </div>
          )}
        </div>

        {/* Import */}
        <div className="border-t pt-3">
          {!showImport ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImport(true)}
              className="text-violet-600 hover:text-violet-700"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Import key from another browser
            </Button>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Paste master key (base64)</Label>
              <Input
                value={importValue}
                onChange={e => setImportValue(e.target.value)}
                placeholder="Paste your exported key here…"
                className="font-mono text-xs"
              />
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

  // HTML kept in memory — never sent raw to any server
  const [htmlContent, setHtmlContent] = useState<string>(() => {
    if (initial?.id) return loadCachedCloudAppHtml(initial.id) ?? '';
    return '';
  });
  const [htmlFileName, setHtmlFileName] = useState('');

  const htmlRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleHtmlPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHtmlContent(ev.target?.result as string);
      setHtmlFileName(file.name);
    };
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
    finally {
      setUploadingThumb(false);
      if (thumbRef.current) thumbRef.current.value = '';
    }
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
      {/* Security note */}
      <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 px-4 py-3 text-xs text-green-800 dark:text-green-300">
        <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600" />
        <span>
          <strong>AES-256-GCM encrypted.</strong> Your HTML is encrypted in-browser before upload.
          The CDN stores only ciphertext — unreadable without your private master key.
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label>App Title *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome App" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Short Description (optional)</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this app do?" />
      </div>

      {/* HTML file picker */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <FileCode className="h-4 w-4 text-purple-500" />
          HTML File *
          <span className="text-xs font-normal text-muted-foreground ml-1">(encrypted before upload)</span>
        </Label>
        <input ref={htmlRef} type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlPick} />
        {htmlContent ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-green-700 dark:text-green-400 font-medium text-xs truncate">
                {htmlFileName || (initial?.id ? `${initial.id}.html (existing)` : 'HTML loaded')}
              </p>
              <p className="text-green-600/70 text-xs">{formatBytes(new Blob([htmlContent]).size)} · will be encrypted before upload</p>
            </div>
            <button
              type="button"
              onClick={() => { setHtmlContent(''); setHtmlFileName(''); }}
              className="text-green-500 hover:text-red-500 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
            onClick={() => htmlRef.current?.click()}
          >
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Upload className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Click to choose your HTML file</p>
              <p className="text-xs text-muted-foreground mt-1">Encrypted in-browser · then uploaded to cloud storage</p>
            </div>
            <Button type="button" variant="outline" size="sm">
              <FileCode className="h-4 w-4 mr-2" /> Choose .html file
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-blue-500" />
          Thumbnail Image (optional)
          <span className="text-xs font-normal text-muted-foreground ml-1">(preview only — public is fine)</span>
        </Label>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
        {thumbnailUrl ? (
          <div className="relative rounded-lg overflow-hidden aspect-video w-48 border">
            <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setThumbnailUrl('')}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-600/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => thumbRef.current?.click()}
              disabled={uploadingThumb}
            >
              {uploadingThumb
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                : <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload thumbnail</>
              }
            </Button>
            <Input type="url" placeholder="Or paste image URL" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">If omitted, a coloured gradient is used.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={handleSave}>{initial ? 'Update App' : 'Add App'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Apps Section ─────────────────────────────────────────────────────────────

function CloudAppsSection() {
  const { mutateAsync: uploadFile } = useUploadFile();
  const [apps, setApps] = useState<CloudApp[]>(() => loadCloudApps());
  const [isCreating, setIsCreating] = useState(false);
  const [editingApp, setEditingApp] = useState<CloudApp | null>(null);

  const persist = (next: CloudApp[]) => {
    const ordered = next.map((a, i) => ({ ...a, order: i + 1 }));
    saveCloudApps(ordered);
    setApps(ordered);
  };

  const handleSave = async (app: CloudApp, html: string) => {
    const tid = toast.loading('Encrypting…');
    try {
      // 1. Encrypt in browser
      const cipherBytes = await encryptText(html);

      // 2. Upload encrypted blob to Blossom
      toast.loading('Uploading encrypted file…', { id: tid });
      const encryptedBlob = new Blob([cipherBytes], { type: 'application/octet-stream' });
      const encryptedFile = new File([encryptedBlob], `${app.id}.enc`, { type: 'application/octet-stream' });
      const tags = await uploadFile(encryptedFile);
      const encryptedUrl = tags[0][1];

      toast.dismiss(tid);

      // 3. Cache plaintext locally for offline use
      cacheCloudAppHtml(app.id, html);

      // 4. Persist metadata with the CDN URL
      const finalApp: CloudApp = { ...app, encryptedUrl };

      if (editingApp) {
        persist(apps.map(a => a.id === finalApp.id ? finalApp : a));
        toast.success('App updated & re-encrypted');
      } else {
        persist([...apps, { ...finalApp, order: apps.length + 1 }]);
        toast.success('App encrypted & uploaded to Cloud ☁️');
      }
      setIsCreating(false);
      setEditingApp(null);
    } catch (e) {
      toast.dismiss(tid);
      toast.error('Failed: ' + String(e).slice(0, 100));
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this app from Cloud? This cannot be undone.')) return;
    deleteCachedCloudAppHtml(id);
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

      {/* Encryption key manager */}
      <KeyManager />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-purple-600" />
                Cloud Apps
              </CardTitle>
              <CardDescription>
                HTML apps are <strong>AES-256-GCM encrypted</strong> in your browser before upload.
                The CDN file is pure ciphertext — unreadable without your master key.
              </CardDescription>
            </div>
            {!isCreating && !editingApp && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add App
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Add / Edit form */}
      {(isCreating || editingApp) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingApp ? 'Edit App' : 'Add New App'}</CardTitle>
          </CardHeader>
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

      {/* Apps list */}
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
              {apps.map((app, index) => (
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
                        <Lock className="h-2.5 w-2.5 mr-1" />
                        AES-256-GCM
                      </Badge>
                      {app.encryptedUrl && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-400">
                          <Cloud className="h-2.5 w-2.5 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {app.htmlSize && (
                        <Badge variant="secondary" className="text-xs">{formatBytes(app.htmlSize)}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => handleMove(index, -1)} title="Move up">
                      <MoveUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === apps.length - 1} onClick={() => handleMove(index, 1)} title="Move down">
                      <MoveDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditingApp(app); setIsCreating(false); }} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(app.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
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
    if (users.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('A user with that name already exists'); return;
    }
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Cloud Users
              </CardTitle>
              <CardDescription>
                Create login credentials for people you want to grant Cloud access.
                Share the <strong>Username (ID)</strong> and password with them.
              </CardDescription>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Local-only credentials</p>
            <p>Credentials are stored in this browser's localStorage and never sent to any server. Share only with trusted people.</p>
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
            <div className="py-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No Cloud users yet.</p>
            </div>
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
        <TabsTrigger value="apps" className="flex items-center gap-2">
          <Cloud className="h-4 w-4" /> Apps
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Users
        </TabsTrigger>
      </TabsList>
      <TabsContent value="apps"><CloudAppsSection /></TabsContent>
      <TabsContent value="users"><CloudUsersSection /></TabsContent>
    </Tabs>
  );
}

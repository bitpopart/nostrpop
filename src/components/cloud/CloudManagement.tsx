/**
 * CloudManagement — Admin UI for the /admin → Cloud tab.
 *
 * Two sub-sections:
 *  1. Cloud Apps — upload HTML files, add thumbnails, reorder
 *  2. Cloud Users — create/delete credentials for shared access
 *
 * All data is stored in localStorage (private, never sent to Nostr).
 */

import { useState, useRef, useCallback } from 'react';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  loadCloudApps,
  saveCloudApps,
  makeCloudAppId,
  loadCloudUsers,
  saveCloudUsers,
  createCloudUser,
  type CloudApp,
  type CloudUser,
} from '@/lib/cloudTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, X, Upload, Trash2, Loader2, Cloud, Users,
  FileCode, Eye, MoveUp, MoveDown, KeyRound, User,
  ExternalLink, ImageIcon, Pencil, Check, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((a, i) => ({ ...a, order: i + 1 }));
}

// ─── App Form ─────────────────────────────────────────────────────────────────

interface AppFormProps {
  initial?: CloudApp;
  onSave: (app: CloudApp) => void;
  onCancel: () => void;
  uploadFile: (f: File) => Promise<string[][]>;
}

function AppForm({ initial, onSave, onCancel, uploadFile }: AppFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [htmlUrl, setHtmlUrl] = useState(initial?.htmlUrl ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '');
  const [uploadingHtml, setUploadingHtml] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const htmlRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleHtmlUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHtml(true);
    try {
      const tags = await uploadFile(file);
      setHtmlUrl(tags[0][1]);
      toast.success('HTML file uploaded');
    } catch { toast.error('Failed to upload HTML file'); }
    finally {
      setUploadingHtml(false);
      if (htmlRef.current) htmlRef.current.value = '';
    }
  }, [uploadFile]);

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
    if (!htmlUrl.trim()) { toast.error('Please upload an HTML file'); return; }

    const app: CloudApp = {
      id: initial?.id ?? makeCloudAppId(title),
      title: title.trim(),
      description: description.trim() || undefined,
      htmlUrl: htmlUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      order: initial?.order,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(app);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>App Title *</Label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="My Awesome App"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Short Description (optional)</Label>
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this app do?"
        />
      </div>

      {/* HTML Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <FileCode className="h-4 w-4 text-purple-500" />
          HTML File *
        </Label>
        <input ref={htmlRef} type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlUpload} />
        {htmlUrl ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 text-sm">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span className="flex-1 truncate text-green-700 dark:text-green-400 font-mono text-xs">{htmlUrl}</span>
            <button
              type="button"
              onClick={() => setHtmlUrl('')}
              className="text-green-500 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => htmlRef.current?.click()}
              disabled={uploadingHtml}
              className="w-full border-dashed"
            >
              {uploadingHtml
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                : <><Upload className="h-4 w-4 mr-2" />Upload HTML file</>
              }
            </Button>
            <Input
              type="url"
              placeholder="Or paste a direct URL to the HTML file"
              value={htmlUrl}
              onChange={e => setHtmlUrl(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-blue-500" />
          Thumbnail Image (optional)
        </Label>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
        {thumbnailUrl ? (
          <div className="space-y-2">
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
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => thumbRef.current?.click()}
              disabled={uploadingThumb}
            >
              {uploadingThumb
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                : <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload thumbnail</>
              }
            </Button>
            <Input
              type="url"
              placeholder="Or paste image URL"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">If omitted, a coloured gradient placeholder is used.</p>
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

  const handleSave = (app: CloudApp) => {
    if (editingApp) {
      persist(apps.map(a => a.id === app.id ? app : a));
      toast.success('App updated');
    } else {
      persist([...apps, { ...app, order: apps.length + 1 }]);
      toast.success('App added to Cloud');
    }
    setIsCreating(false);
    setEditingApp(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this app from Cloud? This cannot be undone.')) return;
    persist(apps.filter(a => a.id !== id));
    toast.success('App removed');
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= apps.length) return;
    persist(reorder(apps, index, to));
  };

  const uploadFileFn = async (file: File) => {
    return await uploadFile(file);
  };

  return (
    <div className="space-y-6">

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
                Upload HTML pages / apps that appear in the private Cloud workspace. Only HTML files.
              </CardDescription>
            </div>
            {!isCreating && !editingApp && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add App
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
              uploadFile={uploadFileFn}
            />
          </CardContent>
        </Card>
      )}

      {/* Apps list */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Apps ({apps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Cloud className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No Cloud apps yet. Add your first app above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app, index) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/40 transition-colors"
                >
                  {/* Thumbnail */}
                  {app.thumbnailUrl ? (
                    <img src={app.thumbnailUrl} alt={app.title} className="w-20 h-14 object-cover rounded-lg shrink-0 border" />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <FileCode className="h-6 w-6 text-white/70" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{app.title}</p>
                    {app.description && (
                      <p className="text-xs text-muted-foreground truncate">{app.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <FileCode className="h-2.5 w-2.5 mr-1 text-purple-500" />
                        HTML
                      </Badge>
                      <a
                        href={app.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Open file
                      </a>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      title="Move up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === apps.length - 1}
                      onClick={() => handleMove(index, 1)}
                      title="Move down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingApp(app); setIsCreating(false); }}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(app.id)}
                      title="Delete"
                    >
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

  const persist = (next: CloudUser[]) => {
    saveCloudUsers(next);
    setUsers(next);
  };

  const handleAdd = () => {
    if (!newName.trim()) { toast.error('Please enter a name'); return; }
    if (!newPassword.trim() || newPassword.length < 4) { toast.error('Password must be at least 4 characters'); return; }

    const user = createCloudUser(newName.trim(), newPassword);
    // Check duplicate username
    if (users.some(u => u.id === user.id || u.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('A user with that name already exists');
      return;
    }
    persist([...users, user]);
    toast.success(`User "${user.name}" created — ID: ${user.id}`);
    setNewName('');
    setNewPassword('');
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this Cloud user?')) return;
    persist(users.filter(u => u.id !== id));
    toast.success('User deleted');
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Cloud Users
              </CardTitle>
              <CardDescription>
                Create login credentials for people you want to grant access to the Cloud workspace.
                Share the <strong>Username (ID)</strong> and password with them.
              </CardDescription>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Security notice */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Local-only credentials</p>
            <p>Credentials are stored in your browser's localStorage and never sent to any server. They protect the Cloud page — not a system account. Share credentials only with trusted people.</p>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>New Cloud User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Name (display name)
              </Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Johannes or Design Team"
              />
              <p className="text-xs text-muted-foreground">
                The login username will be auto-generated from this name (shown after creation).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" />
                Password
              </Label>
              <Input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Choose a password (min. 4 characters)"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleAdd}>Create User</Button>
              <Button variant="ghost" onClick={() => { setIsCreating(false); setNewName(''); setNewPassword(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No Cloud users yet. Add your first user above.</p>
              <p className="text-xs mt-1">Only you (the admin, via Nostr login) can manage this section.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/40 transition-colors"
                >
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{user.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        <span className="text-slate-400">ID/login:</span> {user.id}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Password:</span>
                        <span className="font-mono">
                          {showPasswords[user.id] ? user.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(user.id)}
                          className="text-blue-500 hover:text-blue-700 ml-1"
                          title={showPasswords[user.id] ? 'Hide' : 'Show'}
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 shrink-0"
                    onClick={() => handleDelete(user.id)}
                    title="Delete user"
                  >
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

// ─── Main CloudManagement Component ──────────────────────────────────────────

export function CloudManagement() {
  return (
    <Tabs defaultValue="apps">
      <TabsList className="mb-6">
        <TabsTrigger value="apps" className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          Apps
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
      </TabsList>

      <TabsContent value="apps">
        <CloudAppsSection />
      </TabsContent>

      <TabsContent value="users">
        <CloudUsersSection />
      </TabsContent>
    </Tabs>
  );
}

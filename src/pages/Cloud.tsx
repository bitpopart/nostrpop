import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCloudAuth } from '@/hooks/useCloudAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  loadCloudApps, loadCachedCloudAppHtml, cacheCloudAppHtml,
  loadEncryptedAppData, migrateCloudDataToIDB, type CloudApp,
} from '@/lib/cloudTypes';
import { decryptFromB64 } from '@/lib/cloudCrypto';
import {
  Cloud, Lock, LogOut, Eye, Grid3X3, KeyRound, User,
  AlertCircle, Sparkles, Shield, Settings, Loader2, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Thumbnail colour palette ──────────────────────────────────────────────────
const CARD_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-rose-500 to-pink-600',     'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-violet-600','from-sky-500 to-blue-600',
];
function cardGradient(app: CloudApp, index: number) {
  if (app.thumbnailColor) return '';
  return CARD_COLORS[index % CARD_COLORS.length];
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    setTimeout(() => {
      if (!onLogin(username.trim(), password)) {
        setError('Invalid username or password.');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30 mb-2">
            <Cloud className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">BitPopArt Cloud</h1>
          <p className="text-slate-400 text-sm">Private workspace — authorised access only</p>
        </div>
        <Card className="border-slate-700/50 bg-slate-800/60 backdrop-blur shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" /> Sign in
            </CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials to access the Cloud.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cloud-username" className="text-slate-300 text-sm">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input id="cloud-username" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username" autoComplete="username" required
                    className="pl-9 bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cloud-password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input id="cloud-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password" autoComplete="current-password" required
                    className="pl-9 bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}
              <Button type="submit" disabled={loading || !username || !password}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold">
                {loading
                  ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</span>
                  : <span className="flex items-center gap-2"><Lock className="h-4 w-4" />Sign in</span>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-600 mt-6">Credentials managed by the site administrator.</p>
      </div>
    </div>
  );
}

// ── App Card ──────────────────────────────────────────────────────────────────
function AppCard({ app, index, onClick, loading }: {
  app: CloudApp; index: number; onClick: () => void; loading: boolean;
}) {
  const gradient = cardGradient(app, index);
  return (
    <button onClick={onClick} disabled={loading}
      className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-purple-400/50 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0">
      <div className="relative aspect-video w-full overflow-hidden"
        style={app.thumbnailColor ? { backgroundColor: app.thumbnailColor } : undefined}>
        {app.thumbnailUrl
          ? <img src={app.thumbnailUrl} alt={app.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          : <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}><Sparkles className="h-10 w-10 text-white/40" /></div>
        }
        {/* Loading / hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {loading ? (
            <div className="bg-black/60 absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                <span className="text-white text-xs">Decrypting…</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold text-slate-900 shadow-lg">
                <Eye className="h-4 w-4" /> Open App
              </div>
            </div>
          )}
        </div>
        {/* Encryption badge */}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Lock className="h-2.5 w-2.5 text-green-400" />
            <span className="text-green-400 text-[10px] font-medium">Encrypted</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-slate-800/80 backdrop-blur">
        <h3 className="font-semibold text-white truncate">{app.title}</h3>
        {app.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{app.description}</p>}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs border-green-500/40 text-green-300 bg-green-950/30">
            <Lock className="h-2.5 w-2.5 mr-1" /> AES-256-GCM
          </Badge>
        </div>
      </div>
    </button>
  );
}

// ── Cloud Header ──────────────────────────────────────────────────────────────
function CloudHeader({
  isAdmin, session, activeApp, onBack, onManage, onLogout,
}: {
  isAdmin: boolean;
  session: { name: string } | null;
  activeApp: CloudApp | null;
  onBack: () => void;
  onManage: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="flex-none h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm z-20">
      {/* Left side */}
      <div className="flex items-center gap-2 min-w-0">
        {activeApp ? (
          /* ── App view: back button + app name ── */
          <>
            <Button variant="ghost" size="sm" onClick={onBack}
              className="text-slate-300 hover:text-white hover:bg-slate-800/60 h-8 px-2 shrink-0 gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">All Apps</span>
            </Button>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <Cloud className="h-3 w-3 text-white" />
              </div>
              <span className="text-white font-semibold text-sm truncate max-w-[160px] sm:max-w-xs">
                {activeApp.title}
              </span>
              <Lock className="h-3 w-3 text-green-400 shrink-0" title="AES-256-GCM encrypted" />
            </div>
          </>
        ) : (
          /* ── App grid view: logo + title ── */
          <>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-white font-bold text-base leading-none">BitPopArt Cloud</span>
              <span className="hidden sm:block text-xs text-slate-500 leading-none mt-0.5">Private workspace</span>
            </div>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Session pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
          {isAdmin
            ? <Shield className="h-3.5 w-3.5 text-violet-400" />
            : <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          <span className="text-sm text-slate-300">{session?.name ?? 'Admin'}</span>
          {isAdmin && <Badge className="text-[10px] px-1.5 py-0 bg-violet-600/40 text-violet-300 border-0">Admin</Badge>}
        </div>
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={onManage}
            className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8" title="Manage Cloud apps">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Manage</span>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onLogout}
          className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">Sign out</span>
        </Button>
      </div>
    </header>
  );
}

// ── Main Cloud Page ───────────────────────────────────────────────────────────
export default function CloudPage() {
  const navigate = useNavigate();
  const { session, isLoggedIn, login, adminAutoLogin, logout } = useCloudAuth();
  const isAdmin = useIsAdmin();

  const [apps, setApps] = useState<CloudApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [openingAppId, setOpeningAppId] = useState<string | null>(null);

  // Currently open app + its blob URL for the iframe
  const [activeApp, setActiveApp] = useState<CloudApp | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const prevBlobRef = useRef<string | null>(null);

  // Admin auto-bypass
  useEffect(() => {
    if (isAdmin && !isLoggedIn) adminAutoLogin();
  }, [isAdmin, isLoggedIn, adminAutoLogin]);

  // Load app list once authenticated + run one-time IDB migration
  useEffect(() => {
    if (!isLoggedIn) return;
    const apps = loadCloudApps();
    setApps(apps);
    setLoadingApps(false);
    // Migrate any old localStorage blobs into IndexedDB silently
    migrateCloudDataToIDB(apps.map(a => a.id)).catch(() => null);
  }, [isLoggedIn]);

  // Revoke old blob URL when switching apps or going back
  useEffect(() => {
    return () => {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
    };
  }, []);

  const openApp = useCallback(async (app: CloudApp) => {
    if (openingAppId) return;
    setOpeningAppId(app.id);
    setAppLoading(true);

    try {
      let html: string | null = null;

      // 1. Plaintext cache → instant (async IDB read)
      html = await loadCachedCloudAppHtml(app.id);

      // 2. Decrypt from IndexedDB
      if (!html) {
        const b64 = await loadEncryptedAppData(app.id);
        if (!b64) {
          toast.error('App data not found. Re-upload the HTML file in Admin → Cloud.');
          return;
        }
        try {
          html = await decryptFromB64(b64);
        } catch {
          toast.error('Decryption failed. Check the master key in Admin → Cloud → Encryption Key.');
          return;
        }
        // Cache plaintext for next open (non-fatal)
        cacheCloudAppHtml(app.id, html).catch(() => null);
      }

      // Revoke previous blob
      if (prevBlobRef.current) {
        URL.revokeObjectURL(prevBlobRef.current);
        prevBlobRef.current = null;
      }

      // 3. Create blob URL for the iframe
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      prevBlobRef.current = url;

      setActiveBlobUrl(url);
      setActiveApp(app);
    } catch (e) {
      toast.error('Could not open app: ' + String(e).slice(0, 80));
    } finally {
      setOpeningAppId(null);
      setAppLoading(false);
    }
  }, [openingAppId]);

  const closeApp = useCallback(() => {
    setActiveApp(null);
    setActiveBlobUrl(null);
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = null;
    }
  }, []);

  if (!isLoggedIn) return <LoginForm onLogin={login} />;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 overflow-hidden">
      {/* Fixed background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[40rem] h-[40rem] rounded-full bg-purple-600/8 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-[40rem] h-[40rem] rounded-full bg-blue-600/8 blur-3xl" />
      </div>

      {/* Persistent header — always visible */}
      <CloudHeader
        isAdmin={isAdmin}
        session={session}
        activeApp={activeApp}
        onBack={closeApp}
        onManage={() => navigate('/admin?tab=cloud')}
        onLogout={logout}
      />

      {/* Content area */}
      {activeApp && activeBlobUrl ? (
        /* ── App iframe — fills remaining height exactly ── */
        <div className="flex-1 relative overflow-hidden">
          {appLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
          )}
          <iframe
            key={activeBlobUrl}
            src={activeBlobUrl}
            title={activeApp.title}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write; web-share; accelerometer; gyroscope; camera; microphone"
            onLoad={() => setAppLoading(false)}
          />
        </div>
      ) : (
        /* ── App grid ── */
        <div className="flex-1 overflow-y-auto relative z-10">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                <Grid3X3 className="h-4 w-4" /> My Apps
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Your private workspace</h2>
              <p className="text-slate-400 text-sm">Click an app to open it.</p>
            </div>

            {loadingApps ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-white/10">
                    <Skeleton className="aspect-video w-full bg-slate-800" />
                    <div className="p-4 bg-slate-800/80 space-y-2">
                      <Skeleton className="h-4 w-3/4 bg-slate-700" />
                      <Skeleton className="h-3 w-1/2 bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                  <Cloud className="h-9 w-9 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-300 font-semibold text-lg">No apps yet</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {isAdmin ? 'Go to Manage to upload your first HTML app.' : "The admin hasn't added any apps yet."}
                  </p>
                </div>
                {isAdmin && (
                  <Button onClick={() => navigate('/admin?tab=cloud')}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white">
                    <Settings className="h-4 w-4 mr-2" /> Add First App
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {apps.map((app, i) => (
                  <AppCard key={app.id} app={app} index={i}
                    loading={openingAppId === app.id}
                    onClick={() => openApp(app)} />
                ))}
              </div>
            )}
          </main>
          <footer className="py-6 text-center text-xs text-slate-700 border-t border-white/5">
            Private Cloud · BitPopArt · AES-256-GCM encrypted
          </footer>
        </div>
      )}
    </div>
  );
}

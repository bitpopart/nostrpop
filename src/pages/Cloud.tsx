import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCloudAuth } from '@/hooks/useCloudAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { loadCloudApps, type CloudApp } from '@/lib/cloudTypes';
import {
  Cloud,
  Lock,
  LogOut,
  Eye,
  Grid3X3,
  KeyRound,
  User,
  AlertCircle,
  Sparkles,
  Shield,
  Settings,
} from 'lucide-react';

// ── Thumbnail colour palette ──────────────────────────────────────────────────
const CARD_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-violet-600',
  'from-sky-500 to-blue-600',
];

function cardGradient(app: CloudApp, index: number): string {
  if (app.thumbnailColor) return '';
  return CARD_COLORS[index % CARD_COLORS.length];
}

// ── Login Form ────────────────────────────────────────────────────────────────

interface LoginFormProps {
  onLogin: (username: string, password: string) => boolean;
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = onLogin(username.trim(), password);
      if (!ok) {
        setError('Invalid username or password. Please try again.');
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
              <Lock className="h-4 w-4 text-purple-400" />
              Sign in
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the Cloud.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cloud-username" className="text-slate-300 text-sm">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="cloud-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                    className="pl-9 bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloud-password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="cloud-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="pl-9 bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Sign in
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          Access credentials are managed by the site administrator.
        </p>
      </div>
    </div>
  );
}

// ── App Thumbnail Card ────────────────────────────────────────────────────────

interface AppCardProps {
  app: CloudApp;
  index: number;
  onClick: () => void;
}

function AppCard({ app, index, onClick }: AppCardProps) {
  const gradient = cardGradient(app, index);

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-purple-400/50 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video w-full overflow-hidden"
        style={app.thumbnailColor ? { backgroundColor: app.thumbnailColor } : undefined}
      >
        {app.thumbnailUrl ? (
          <img
            src={app.thumbnailUrl}
            alt={app.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Sparkles className="h-10 w-10 text-white/40" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold text-slate-900 shadow-lg">
            <Eye className="h-4 w-4" />
            Open App
          </div>
        </div>

        {/* Encryption badge — top right corner */}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Lock className="h-2.5 w-2.5 text-green-400" />
            <span className="text-green-400 text-[10px] font-medium">Encrypted</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-slate-800/80 backdrop-blur">
        <h3 className="font-semibold text-white truncate">{app.title}</h3>
        {app.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{app.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs border-green-500/40 text-green-300 bg-green-950/30">
            <Lock className="h-2.5 w-2.5 mr-1" />
            AES-256-GCM
          </Badge>
        </div>
      </div>
    </button>
  );
}

// ── Main Cloud Page ───────────────────────────────────────────────────────────

export default function CloudPage() {
  const navigate = useNavigate();
  const { session, isLoggedIn, login, logout, adminAutoLogin } = useCloudAuth();
  const isAdmin = useIsAdmin();
  const [apps, setApps] = useState<CloudApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Admin (Nostr-logged-in) gets automatic access — no Cloud password needed
  useEffect(() => {
    if (isAdmin && !isLoggedIn) {
      adminAutoLogin();
    }
  }, [isAdmin, isLoggedIn, adminAutoLogin]);

  // Load apps once authenticated
  useEffect(() => {
    if (isLoggedIn) {
      setApps(loadCloudApps());
      setLoadingApps(false);
    }
  }, [isLoggedIn]);

  // Not logged in → show login wall
  if (!isLoggedIn) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[40rem] h-[40rem] rounded-full bg-purple-600/8 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-[40rem] h-[40rem] rounded-full bg-blue-600/8 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">BitPopArt Cloud</span>
              <span className="hidden sm:block text-xs text-slate-500 leading-none mt-0.5">Private workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Session pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
              {isAdmin
                ? <Shield className="h-3.5 w-3.5 text-violet-400" />
                : <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              }
              <span className="text-sm text-slate-300">{session?.name ?? 'Admin'}</span>
              {isAdmin && <Badge className="text-[10px] px-1.5 py-0 bg-violet-600/40 text-violet-300 border-0">Admin</Badge>}
            </div>

            {/* Admin shortcut to manage apps */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin?tab=cloud')}
                className="text-slate-400 hover:text-white hover:bg-slate-800/60"
                title="Manage Cloud apps"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Manage</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 space-y-1">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
            <Grid3X3 className="h-4 w-4" />
            My Apps
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Your private workspace</h2>
          <p className="text-slate-400 text-sm">Click an app to open it full screen.</p>
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
                {isAdmin
                  ? 'Go to Manage to upload your first HTML app.'
                  : 'The admin hasn\'t added any apps to the Cloud yet.'}
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin?tab=cloud')}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Add First App
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {apps.map((app, i) => (
              <AppCard
                key={app.id}
                app={app}
                index={i}
                onClick={() => navigate(`/cloud/${app.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-slate-700 border-t border-white/5">
        Private Cloud · BitPopArt · AES-256-GCM encrypted
      </footer>
    </div>
  );
}

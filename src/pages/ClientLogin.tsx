import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  redeemCode,
  lookupNpub,
  setSession,
  getSession,
  getPages,
} from '@/lib/clientPortal';
import { loadPortalConfig } from '@/hooks/usePortalSync';
import { nip19 } from 'nostr-tools';
import { KeyRound, Zap, ArrowRight, Lock, CheckCircle2, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

type ConfigStatus = 'loading' | 'loaded' | 'offline';

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';
  const codeParam = searchParams.get('code') ?? '';

  const { user } = useCurrentUser();

  const [codeInput, setCodeInput] = useState(codeParam.toUpperCase());
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [configStatus, setConfigStatus] = useState<ConfigStatus>('loading');
  const fetchedRef = useRef(false);

  // ── Step 1: Always fetch portal config from relay first ──────────────────
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // If there's already a session, skip fetching and redirect immediately
    const session = getSession();
    if (session) {
      const dest = resolveRedirect(session.pageIds, redirectTo);
      navigate(dest, { replace: true });
      return;
    }

    // Fetch config from Nostr relay, then check if code/npub auto-matches
    loadPortalConfig().then((found) => {
      setConfigStatus(found ? 'loaded' : 'offline');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: After config loads, auto-try the code from URL param ─────────
  useEffect(() => {
    if (configStatus === 'loading') return;
    if (!codeParam || codeSuccess) return;

    const code = redeemCode(codeParam);
    if (code) {
      setCodeSuccess(true);
      setSession({ type: 'code', codeId: code.id, pageIds: code.pageIds });
      setTimeout(() => {
        navigate(resolveRedirect(code.pageIds, redirectTo), { replace: true });
      }, 600);
    } else {
      setCodeError('Invalid or expired access code. Please check and try again.');
    }
  }, [configStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 3: After config loads, auto-check logged-in Nostr user ──────────
  useEffect(() => {
    if (!user || configStatus === 'loading') return;
    const npubStr = nip19.npubEncode(user.pubkey);
    const entry = lookupNpub(npubStr);
    if (entry && entry.active) {
      setSession({ type: 'npub', npub: npubStr, pageIds: entry.pageIds });
      navigate(resolveRedirect(entry.pageIds, redirectTo), { replace: true });
    }
  }, [user, configStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  function resolveRedirect(pageIds: string[], redirectHint: string): string {
    if (redirectHint) return redirectHint;
    const pages = getPages().filter(p => pageIds.includes(p.id) && p.active);
    if (pages.length === 1) return `/client/${pages[0].slug}`;
    return '/client';
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (configStatus === 'loading') return;
    setCodeError('');
    const code = redeemCode(codeInput);
    if (!code) {
      setCodeError('Invalid or expired access code. Please check and try again.');
      return;
    }
    setCodeSuccess(true);
    setSession({ type: 'code', codeId: code.id, pageIds: code.pageIds });
    setTimeout(() => {
      navigate(resolveRedirect(code.pageIds, redirectTo), { replace: true });
    }, 600);
  };

  const isLoading = configStatus === 'loading';
  const isOffline = configStatus === 'offline';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5 px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src="/bitpopart-logo.svg"
            alt="BitPopArt"
            className="h-16 w-auto mx-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight">Client Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              BitPopArt · Private client access
            </p>
          </div>
        </div>

        {/* Status banner */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-1">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-500" />
            <span>Connecting to access server…</span>
          </div>
        )}
        {isOffline && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2.5">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Could not reach access server. Your code may still work if you've used this device before.</span>
          </div>
        )}

        {/* Access Code card */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-base">Enter Access Code</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Use the code you received from BitPopArt to access your designs.
            </p>

            {codeSuccess ? (
              <div className="flex items-center gap-2 text-green-600 font-semibold py-3">
                <CheckCircle2 className="h-5 w-5" />
                Code accepted! Redirecting…
              </div>
            ) : (
              <form onSubmit={handleCodeSubmit} className="space-y-3">
                <Input
                  placeholder="e.g. BPX7-K3MN"
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
                  className="font-mono text-lg tracking-widest text-center uppercase"
                  maxLength={9}
                  autoFocus={!codeParam}
                />
                {codeError && (
                  <div className="flex items-center gap-1.5 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {codeError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold hover:from-orange-600 hover:to-yellow-500 gap-2"
                  disabled={codeInput.replace('-', '').length < 8 || isLoading}
                >
                  {isLoading ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Connecting…</>
                  ) : (
                    <>Access Portal <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Nostr login card */}
        <Card className="border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h2 className="font-bold text-base">Login with Nostr</h2>
              <Badge variant="outline" className="text-xs">Alternative</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              If your Nostr public key has been whitelisted, log in with your Nostr identity.
            </p>

            {user && isLoading ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                Checking access…
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-orange-400" />
                Logged in as <span className="font-mono text-xs truncate">{nip19.npubEncode(user.pubkey).slice(0, 20)}…</span>
                <span className="text-destructive text-xs">— not whitelisted</span>
              </div>
            ) : (
              <LoginArea className="w-full" />
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Don't have an access code?{' '}
          <a href="https://bitpopart.com" className="text-orange-500 hover:text-orange-400">
            Contact BitPopArt →
          </a>
        </p>
      </div>
    </div>
  );
}

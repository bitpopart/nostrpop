import { useState, useEffect } from 'react';
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
import { nip19 } from 'nostr-tools';
import { KeyRound, Zap, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '';

  const { user } = useCurrentUser();
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [checkingNpub, setCheckingNpub] = useState(false);

  // If there's already a valid session, bounce straight to destination
  useEffect(() => {
    const session = getSession();
    if (session) {
      const dest = resolveRedirect(session.pageIds, redirectTo);
      navigate(dest, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user logs in via Nostr, check whitelist
  useEffect(() => {
    if (!user) return;
    setCheckingNpub(true);
    try {
      const npubStr = nip19.npubEncode(user.pubkey);
      const entry = lookupNpub(npubStr);
      if (entry && entry.active) {
        setSession({ type: 'npub', npub: npubStr, pageIds: entry.pageIds });
        const dest = resolveRedirect(entry.pageIds, redirectTo);
        navigate(dest, { replace: true });
      }
    } finally {
      setCheckingNpub(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function resolveRedirect(pageIds: string[], redirectHint: string): string {
    if (redirectHint) return redirectHint;
    // If there's only one page, go straight to it
    const pages = getPages().filter(p => pageIds.includes(p.id) && p.active);
    if (pages.length === 1) return `/client/${pages[0].slug}`;
    return '/client';
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    const code = redeemCode(codeInput);
    if (!code) {
      setCodeError('Invalid or expired access code. Please check and try again.');
      return;
    }
    setCodeSuccess(true);
    setSession({ type: 'code', codeId: code.id, pageIds: code.pageIds });
    setTimeout(() => {
      const dest = resolveRedirect(code.pageIds, redirectTo);
      navigate(dest, { replace: true });
    }, 800);
  };

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
                  autoFocus
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
                  disabled={codeInput.length < 8}
                >
                  Access Portal <ArrowRight className="h-4 w-4" />
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

            {checkingNpub && user ? (
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

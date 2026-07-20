import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const LNURL_ENDPOINT = 'https://walletofsatoshi.com/.well-known/lnurlp/bitpopart';
const SESSION_KEY = 'bpa_lightning_status';
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedStatus {
  status: 'online' | 'offline';
  ts: number;
}

function getCachedStatus(): 'online' | 'offline' | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const cached: CachedStatus = JSON.parse(raw);
    if (Date.now() - cached.ts < SESSION_TTL_MS) return cached.status;
  } catch { /* ignore */ }
  return null;
}

function setCachedStatus(status: 'online' | 'offline') {
  try {
    const entry: CachedStatus = { status, ts: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(entry));
  } catch { /* ignore */ }
}

export function LightningStatusIndicator() {
  // Start optimistically as 'online' — it's almost always up.
  // Only show "checking" if we have no cached value yet.
  const cached = getCachedStatus();
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>(cached ?? 'online');

  useEffect(() => {
    // If we have a fresh cached result, skip the network check entirely.
    if (getCachedStatus() !== null) return;

    const controller = new AbortController();
    // Hard 3-second timeout — lightning endpoint is fast when healthy.
    const timer = setTimeout(() => controller.abort(), 3000);

    const checkLightningStatus = async () => {
      try {
        const response = await fetch(LNURL_ENDPOINT, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          const next = data.tag === 'payRequest' ? 'online' : 'offline';
          setStatus(next);
          setCachedStatus(next);
        } else {
          setStatus('offline');
          setCachedStatus('offline');
        }
      } catch {
        // AbortError (timeout) or network error — keep optimistic 'online'
        // so the badge doesn't scare users when lightning is fine but the
        // endpoint is temporarily slow.
        setStatus('online');
        setCachedStatus('online');
      } finally {
        clearTimeout(timer);
      }
    };

    checkLightningStatus();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  if (status === 'checking') {
    // Shouldn't normally be seen anymore (we start optimistically as 'online'),
    // but keep for safety — render nothing to avoid layout shift.
    return null;
  }

  if (status === 'online') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        <CheckCircle className="w-3 h-3 mr-1" />
        Lightning Online
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="text-xs">
      <AlertTriangle className="w-3 h-3 mr-1" />
      Lightning Offline
    </Badge>
  );
}

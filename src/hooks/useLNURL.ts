import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

interface LNURLPayResponse {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  allowsNostr?: boolean;
  nostrPubkey?: string;
  tag: string;
}

interface LNURLInvoiceResponse {
  pr: string; // Lightning invoice
  verify?: string; // URL to check payment status (LNURL-verify)
  successAction?: {
    tag: string;
    message?: string;
    url?: string;
  };
}

// Convert lightning address to LNURL endpoint URL
function lightningAddressToURL(address: string): string {
  const [username, domain] = address.split('@');
  if (!username || !domain) throw new Error('Invalid lightning address format');
  return `https://${domain}/.well-known/lnurlp/${username}`;
}

/**
 * Fetch a URL, automatically retrying through the CORS proxy on failure.
 * Returns the parsed JSON.
 */
async function fetchWithCORSFallback(url: string): Promise<unknown> {
  // Try direct first
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const text = await r.text();
      return JSON.parse(text);
    }
    // If status error, fall through to proxy
  } catch {
    // Network error (likely CORS) — fall through to proxy
  }

  // Retry via CORS proxy
  const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`;
  const r2 = await fetch(proxied, { signal: AbortSignal.timeout(8000) });
  if (!r2.ok) {
    const text = await r2.text();
    throw new Error(`LNURL request failed (${r2.status}): ${text.slice(0, 120)}`);
  }
  const text2 = await r2.text();
  try {
    return JSON.parse(text2);
  } catch {
    throw new Error(`Invalid JSON from LNURL endpoint: ${text2.slice(0, 120)}`);
  }
}

// Fetch LNURL pay data (with CORS fallback)
async function fetchLNURLPay(lnurlOrAddress: string): Promise<LNURLPayResponse> {
  const url = lnurlOrAddress.includes('@')
    ? lightningAddressToURL(lnurlOrAddress)
    : lnurlOrAddress;

  const data = await fetchWithCORSFallback(url) as LNURLPayResponse;

  if (!data || (data.tag && data.tag !== 'payRequest')) {
    throw new Error(`Invalid LNURL response: tag='${data?.tag}'`);
  }

  return data;
}

// Request Lightning invoice from LNURL callback (with CORS fallback)
async function requestInvoice(
  callback: string,
  amountMsats: number,
  zapRequest?: string,
): Promise<LNURLInvoiceResponse> {
  const url = new URL(callback);
  url.searchParams.set('amount', amountMsats.toString());
  if (zapRequest) url.searchParams.set('nostr', zapRequest);

  const data = await fetchWithCORSFallback(url.toString()) as LNURLInvoiceResponse & { status?: string; reason?: string };

  if (data.status === 'ERROR') {
    throw new Error(data.reason || 'LNURL service returned an error');
  }
  if (!data.pr) {
    throw new Error('No payment request (pr) in invoice response');
  }

  return data;
}

/**
 * Poll a LNURL-verify URL until payment is confirmed or timeout.
 * Returns true if confirmed, false if timed out.
 */
export async function pollVerifyPayment(verifyUrl: string, timeoutMs = 180_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const data = await fetchWithCORSFallback(verifyUrl) as { settled?: boolean; status?: string };
      if (data.settled === true || data.status === 'OK') return true;
    } catch {
      // ignore — keep polling
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

export function useLNURL(lightningAddress?: string) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch LNURL pay data
  const {
    data: lnurlData,
    isLoading,
    error,
    refetch: refetchLnurl,
  } = useQuery({
    queryKey: ['lnurl', lightningAddress],
    queryFn: () => lightningAddress ? fetchLNURLPay(lightningAddress) : null,
    enabled: !!lightningAddress,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const supportsZaps = lnurlData?.allowsNostr === true && !!lnurlData.nostrPubkey;

  /**
   * Get a Lightning invoice for the given amount in sats.
   * Returns { pr, verify? } on success, null on failure.
   */
  const getZapInvoice = async (
    amount: number, // sats
    zapRequest?: string,
  ): Promise<{ pr: string; verify?: string } | null> => {
    if (!lnurlData) {
      // Try refreshing before giving up
      const result = await refetchLnurl();
      if (!result.data) {
        toast({
          title: 'Lightning Not Available',
          description: 'Could not reach the payment server. Check your connection and try again.',
          variant: 'destructive',
        });
        return null;
      }
    }

    const data = lnurlData ?? (await refetchLnurl()).data;
    if (!data) return null;

    const amountMsats = amount * 1000;

    if (amountMsats < data.minSendable) {
      toast({
        title: 'Amount Too Low',
        description: `Minimum is ${Math.ceil(data.minSendable / 1000)} sats.`,
        variant: 'destructive',
      });
      return null;
    }
    if (amountMsats > data.maxSendable) {
      toast({
        title: 'Amount Too High',
        description: `Maximum is ${Math.floor(data.maxSendable / 1000)} sats.`,
        variant: 'destructive',
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const inv = await requestInvoice(data.callback, amountMsats, zapRequest);
      return { pr: inv.pr, verify: inv.verify };
    } catch (err) {
      console.error('[useLNURL] Invoice failed:', err);
      toast({
        title: 'Invoice Failed',
        description: err instanceof Error ? err.message : 'Failed to generate invoice. Try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay invoice via WebLN or lightning: URI
  const payInvoice = async (invoice: string) => {
    try {
      if (window.webln) {
        await window.webln.enable();
        const result = await window.webln.sendPayment(invoice);
        toast({ title: 'Payment Sent! ⚡', description: 'Zap sent via WebLN.' });
        return result;
      } else {
        window.open(`lightning:${invoice}`, '_blank');
        toast({ title: 'Wallet Opened', description: 'Complete the payment in your lightning wallet.' });
        return null;
      }
    } catch (err) {
      console.error('[useLNURL] Payment failed:', err);
      toast({
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'Failed to send payment.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    lnurlData,
    isLoading,
    error,
    supportsZaps,
    isProcessing,
    getZapInvoice,
    payInvoice,
    refetch: refetchLnurl,
    minSendable: lnurlData ? Math.ceil(lnurlData.minSendable / 1000) : 1,
    maxSendable: lnurlData ? Math.floor(lnurlData.maxSendable / 1000) : 1_000_000,
  };
}

// WebLN type declarations are in vite-env.d.ts

import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { toast } from 'sonner';
import type { NostrEvent } from '@nostrify/nostrify';

const ZAPSTORE_BLOSSOM = 'https://cdn.zapstore.dev';
// CORS proxy used for the PUT /upload request from the browser
const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

export interface ZapstoreUploadResult {
  url: string;
  sha256: string;
  size: number;
  filename: string;
}

/** Compute SHA-256 hex from an ArrayBuffer */
async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if a file already exists on the Blossom CDN.
 * Uses a simple GET via proxy to avoid CORS preflight issues.
 */
async function blossomExists(sha256: string): Promise<boolean> {
  try {
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${ZAPSTORE_BLOSSOM}/${sha256}`)}`;
    const res = await fetch(proxyUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false; // assume not exists if check fails
  }
}

/**
 * Upload a file to cdn.zapstore.dev via Blossom PUT /upload.
 * Routes through CORS proxy to avoid browser cross-origin restrictions.
 * Sends Content-Digest + Authorization (NIP-24242 auth event) headers.
 */
async function blossomUpload(
  file: File,
  sha256: string,
  signer: {
    signEvent: (e: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => Promise<NostrEvent>;
  },
  onProgress?: (pct: number) => void,
): Promise<string> {
  const url = `${ZAPSTORE_BLOSSOM}/${sha256}`;

  // Build NIP-24242 Blossom auth event (kind 24242, not 98)
  const authEvent = await signer.signEvent({
    kind: 24242,
    content: `Upload ${file.name}`,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'upload'],
      ['x', sha256],
      ['expiration', String(Math.floor(Date.now() / 1000) + 600)],
    ],
  });

  const authHeader = `Nostr ${btoa(JSON.stringify(authEvent))}`;

  // Read the file as ArrayBuffer so we can send it via fetch
  // (XHR gave us 10% hang due to CORS preflight; fetch via proxy avoids this)
  const body = await file.arrayBuffer();

  // Simulate progress since fetch doesn't expose upload progress
  onProgress?.(10);

  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${ZAPSTORE_BLOSSOM}/upload`)}`;

  onProgress?.(20);

  const res = await fetch(proxyUrl, {
    method: 'PUT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Digest': sha256,
      'X-Content-Length': String(file.size),
    },
    body,
    signal: AbortSignal.timeout(5 * 60 * 1000), // 5-min timeout
  });

  onProgress?.(90);

  if (!res.ok) {
    const reason = res.headers.get('X-Reason') ?? (await res.text().catch(() => '')).slice(0, 200);
    throw new Error(`CDN upload failed HTTP ${res.status}${reason ? `: ${reason}` : ''}`);
  }

  onProgress?.(100);

  try {
    const json = (await res.json()) as { url?: string };
    return json.url ?? url;
  } catch {
    return url;
  }
}

export interface UploadArgs {
  file: File;
  onProgress?: (stage: string, pct: number) => void;
}

/**
 * Upload an APK to the Zapstore Blossom CDN and get back its
 * content-addressed URL + SHA-256. Skips the upload entirely when the
 * file is already on the CDN (same hash = same file).
 */
export function useZapstoreUpload() {
  const { user } = useCurrentUser();

  return useMutation<ZapstoreUploadResult, Error, UploadArgs>({
    mutationFn: async ({ file, onProgress }) => {
      if (!user) throw new Error('You must be logged in to upload to the Zapstore CDN');

      onProgress?.('Hashing APK…', 0);
      const buf = await file.arrayBuffer();
      const sha256 = await sha256Hex(buf);

      // Check if already on CDN (content-addressed — same APK = same hash)
      onProgress?.('Checking CDN…', 10);
      const alreadyExists = await blossomExists(sha256);
      let url: string;

      if (alreadyExists) {
        url = `${ZAPSTORE_BLOSSOM}/${sha256}`;
        onProgress?.('File already on CDN — skipped upload ✓', 100);
      } else {
        onProgress?.('Uploading to cdn.zapstore.dev…', 20);
        url = await blossomUpload(file, sha256, user.signer, (pct) => {
          // Map the upload's internal 10→100 range into the visible 20→95 range
          onProgress?.('Uploading to cdn.zapstore.dev…', 20 + Math.round((pct / 100) * 75));
        });
        onProgress?.('Done ✓', 100);
      }

      return { url, sha256, size: file.size, filename: file.name };
    },
    onError: (err: Error) => {
      toast.error('❌ Upload Failed', { description: err.message });
    },
  });
}

import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';

/**
 * Upload a video file to Blossom, trying multiple servers in order.
 * Returns the public URL on success.
 *
 * Blossom protocol: PUT /upload with the file as the body, signed
 * via NIP-98 HTTP Auth header.
 */

// Servers ordered by video-friendliness / size limits
const VIDEO_SERVERS = [
  'https://nostr.build',
  'https://blossom.band',
  'https://blossom.primal.net',
];

async function blossomUpload(
  server: string,
  file: File,
  authHeader: string,
): Promise<string> {
  const url = `${server.replace(/\/$/, '')}/upload`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Authorization': authHeader,
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${server}: ${res.status} ${text}`);
  }

  const json = await res.json();
  // Blossom servers return { url } or { sha256, url, ... }
  const fileUrl = json?.url as string | undefined;
  if (!fileUrl) throw new Error(`${server}: no url in response`);
  return fileUrl;
}

/**
 * Build a NIP-98 HTTP Auth event for Blossom upload.
 * Blossom uses kind 24242 with tags: t=upload, size, expiration.
 */
async function buildBlossomAuthHeader(
  signer: { signEvent: (e: object) => Promise<{ id: string; sig: string; pubkey: string; [k: string]: unknown }> },
  file: File,
): Promise<string> {
  const expiration = Math.floor(Date.now() / 1000) + 60 * 5; // 5 min

  const event = {
    kind: 24242,
    content: `Upload ${file.name}`,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'upload'],
      ['size', String(file.size)],
      ['expiration', String(expiration)],
    ],
  };

  const signed = await signer.signEvent(event);
  const encoded = btoa(JSON.stringify(signed));
  return `Nostr ${encoded}`;
}

export function useUploadVideo() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!user) throw new Error('Must be logged in to upload files');

      const authHeader = await buildBlossomAuthHeader(user.signer, file);

      const errors: string[] = [];

      for (const server of VIDEO_SERVERS) {
        try {
          const url = await blossomUpload(server, file, authHeader);
          return url;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(msg);
          // Try next server
        }
      }

      throw new Error(`Upload failed on all servers:\n${errors.join('\n')}`);
    },
  });
}

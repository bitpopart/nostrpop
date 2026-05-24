import { useMutation } from '@tanstack/react-query';
import { BlossomUploader, NostrBuildUploader } from '@nostrify/nostrify/uploaders';
import { useCurrentUser } from './useCurrentUser';

/**
 * Upload a video file, trying multiple uploaders in order until one succeeds.
 * Returns the public URL on success.
 *
 * Upload order:
 *  1. nostr.build  – free, no auth needed, supports video up to 500MB
 *  2. blossom.nostr.build – Blossom server by nostr.build, 100MB free / 500MB with account
 *  3. blossom.primal.net  – last resort, may reject large videos
 */
export function useUploadVideo() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!user) throw new Error('Must be logged in to upload files');

      const errors: string[] = [];

      // ── 1. Try NostrBuildUploader (no auth needed, handles video well) ──
      try {
        const uploader = new NostrBuildUploader({ signer: user.signer });
        const tags = await uploader.upload(file);
        const url = tags[0]?.[1];
        if (url) return url;
        throw new Error('No URL returned');
      } catch (err) {
        errors.push(`nostr.build: ${err instanceof Error ? err.message : String(err)}`);
      }

      // ── 2. Try blossom.nostr.build (Blossom, 100MB free, supports video) ──
      try {
        const uploader = new BlossomUploader({
          servers: ['https://blossom.nostr.build'],
          signer: user.signer,
        });
        const tags = await uploader.upload(file);
        const url = tags[0]?.[1];
        if (url) return url;
        throw new Error('No URL returned');
      } catch (err) {
        errors.push(`blossom.nostr.build: ${err instanceof Error ? err.message : String(err)}`);
      }

      // ── 3. Try blossom.primal.net (last resort) ──
      try {
        const uploader = new BlossomUploader({
          servers: ['https://blossom.primal.net'],
          signer: user.signer,
        });
        const tags = await uploader.upload(file);
        const url = tags[0]?.[1];
        if (url) return url;
        throw new Error('No URL returned');
      } catch (err) {
        errors.push(`blossom.primal.net: ${err instanceof Error ? err.message : String(err)}`);
      }

      throw new Error(
        `Upload failed on all servers:\n• ${errors.join('\n• ')}`
      );
    },
  });
}

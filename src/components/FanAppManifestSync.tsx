import { useEffect, useMemo } from 'react';
import { useFanAppPublishingSettings } from '@/hooks/useFanAppPublishingSettings';

/**
 * Runtime manifest sync for the Fan App.
 *
 * Reads the owner's saved app-icon + screenshot settings (Nostr kind 30078)
 * and swaps the <link rel="manifest"> to a generated blob manifest that
 * includes them. Browsers therefore install the app with the owner's chosen
 * 512×512 icon and store screenshots — without waiting for a repo deploy.
 *
 * When no settings are saved, the static /manifest.webmanifest is left as-is.
 */
export function FanAppManifestSync() {
  const { data: settings } = useFanAppPublishingSettings();
  const iconUrl = settings?.iconUrl ?? '';
  const screenshots = useMemo(() => settings?.screenshots ?? [], [settings]);

  useEffect(() => {
    if (!iconUrl && screenshots.length === 0) return;

    let revoked: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        // Start from the shipped manifest so nothing else is lost.
        const res = await fetch('/manifest.webmanifest');
        if (!res.ok) throw new Error(`manifest fetch ${res.status}`);
        const manifest = await res.json();

        if (iconUrl) {
          const pngIcon = (sizes: string) => ({
            src: iconUrl,
            sizes,
            type: 'image/png',
            purpose: 'any',
          });
          manifest.icons = [
            ...(manifest.icons ?? []).filter(
              (i: { src?: string }) => i.src && !i.src.includes('app-icon-'),
            ),
            pngIcon('192x192'),
            pngIcon('512x512'),
            { ...pngIcon('512x512'), purpose: 'maskable' },
            pngIcon('1024x1024'),
          ];
        }

        if (screenshots.length > 0) {
          manifest.screenshots = screenshots.map((s) => ({
            src: s.url,
            sizes: s.width && s.height ? `${s.width}x${s.height}` : '1080x1920',
            type: 'image/png',
            label: s.label || 'BitPopArt Fan App',
            form_factor: s.width && s.height && s.height > s.width ? 'narrow' : 'wide',
          }));
        }

        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
        const url = URL.createObjectURL(blob);
        if (cancelled) { URL.revokeObjectURL(url); return; }
        revoked = url;

        let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'manifest';
          document.head.appendChild(link);
        }
        link.href = url;
      } catch (err) {
        console.warn('[FanAppManifestSync] failed to inject manifest:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [iconUrl, screenshots]);

  return null;
}

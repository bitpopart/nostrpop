import { useEffect } from 'react';

/**
 * ChatwootWidget
 *
 * Injects the Chatwoot live-chat bubble into every page.
 * The widget handles its own UI — no custom button needed.
 */

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (config: { websiteToken: string; baseUrl: string }) => void };
  }
}

export function ChatwootWidget() {
  useEffect(() => {
    // Avoid loading twice (e.g. React strict mode double-invoke)
    if (document.getElementById('chatwoot-script')) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'left',        // left side so it doesn't clash with other UI
      locale: 'en',
      type: 'standard',
    };

    const script = document.createElement('script');
    script.id = 'chatwoot-script';
    script.src = 'https://app.chatwoot.com/packs/js/sdk.js';
    script.defer = true;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken: '1coVGwvMLwmgwRXJfuXKvtJh',
        baseUrl: 'https://app.chatwoot.com',
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (dev HMR)
      document.getElementById('chatwoot-script')?.remove();
    };
  }, []);

  return null;
}

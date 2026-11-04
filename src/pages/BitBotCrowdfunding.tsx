import type { MouseEvent } from 'react';
import { useSeoMeta } from '@unhead/react';
import html from './bitbot-crowdfunding.html?raw';
import './bitbot-crowdfunding.css';

/**
 * BitBot crowdfunding — bitpopart.com/bitbot/crowdfunding.
 *
 * Static campaign page (markup in bitbot-crowdfunding.html, styles scoped to
 * `.bbcf` in bitbot-crowdfunding.css, images/fonts in
 * public/bitbot/crowdfunding-assets/). Rendered inline under the site
 * menu/footer. The only behaviour is smooth-scroll buttons and the
 * copy-to-clipboard buttons for the Lightning address and npub.
 */
export default function BitBotCrowdfunding() {
  useSeoMeta({
    title: 'Support BitBot — Open source pocket bot | BitPopArt',
    description:
      'Support BitBot: an open-source pocket companion that brings Bitcoin, Nostr and AI together. A collaboration between BitPopArt (Johannes) and Jacco.',
    ogTitle: 'Support BitBot — Open source pocket bot',
    ogDescription:
      'Help us bring BitBot to life: open source, built for freedom. Bitcoin, Nostr and AI in your pocket.',
    ogImage: 'https://bitpopart.com/bitbot/logo.webp',
  });

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const scrollBtn = target.closest<HTMLElement>('[data-target]');
    if (scrollBtn) {
      const id = scrollBtn.getAttribute('data-target');
      const el = id ? document.getElementById(id) : null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const copyBtn = target.closest<HTMLButtonElement>('[data-copy]');
    if (copyBtn) {
      const id = copyBtn.getAttribute('data-copy');
      const text = id ? document.getElementById(id)?.textContent ?? '' : '';
      const done = () => {
        copyBtn.textContent = 'Copied!';
        copyBtn.className = 'btn sm ok';
        window.setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.className = 'btn yellow sm';
        }, 1600);
      };
      navigator.clipboard?.writeText(text).then(done, () => undefined);
    }
  };

  // The markup is our own static file, bundled at build time (not user input).
  return <div className="bbcf" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

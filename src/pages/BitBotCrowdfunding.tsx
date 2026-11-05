import { useEffect } from 'react';
import type { MouseEvent } from 'react';
import { useSeoMeta } from '@unhead/react';
import html from './bitbot-crowdfunding.html?raw';
import './bitbot-crowdfunding.css';

/**
 * BitBot crowdfunding — bitpopart.com/bitbot (also /bitbot/crowdfunding).
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

  // Show what EUR 210 is in USD and sats. The BTC price is cached in
  // localStorage and refreshed at most once an hour, so it is current every day.
  useEffect(() => {
    const PRICE_EUR = 210;
    const KEY = 'bitbot-btc-price';
    const render = (eur: number, usd: number) => {
      const sats = Math.round((PRICE_EUR / eur) * 1e8);
      const dollars = Math.round(PRICE_EUR * (usd / eur));
      const text = `≈ $${dollars.toLocaleString('en-US')}<i>·</i>≈ ${sats.toLocaleString('en-US')} sats`;
      document.querySelectorAll<HTMLElement>('.bbcf [data-live]').forEach((el) => {
        el.innerHTML = text;
      });
    };
    let cached: { eur: number; usd: number; t: number } | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    } catch {
      cached = null;
    }
    if (cached) render(cached.eur, cached.usd);
    if (cached && Date.now() - cached.t < 3600_000) return;
    const ctl = new AbortController();
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd', { signal: ctl.signal })
      .then((r) => r.json())
      .then((d: { bitcoin?: { eur?: number; usd?: number } }) => {
        const eur = d.bitcoin?.eur;
        const usd = d.bitcoin?.usd;
        if (!eur || !usd) return;
        render(eur, usd);
        try {
          localStorage.setItem(KEY, JSON.stringify({ eur, usd, t: Date.now() }));
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => undefined);
    return () => ctl.abort();
  }, []);

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

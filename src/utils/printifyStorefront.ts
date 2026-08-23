// Printify storefront (pop-up store) import helpers.
//
// When a merchant launches a Printify Pop-Up Store they get a PUBLIC storefront
// at https://{store}.printify.me with product pages at /product/{id}/... .
// Those pages are bot-protected (a plain fetch gets HTTP 403) so they have to
// be read through the shop's CORS proxy, and they do NOT emit og:price:amount —
// the price is rendered in the page itself as
//   <span data-testid="variantPrice">$27.10</span>
// which is why the generic OG-meta fallback alone would import the product with
// price 0 and the create form would then refuse to submit. This module extracts
// the fields the rest of the importer needs.

export interface PrintifyParsedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  url: string;
  category?: string;
}

// Printify hosts a merchant's storefront on {store}.printify.me; the marketing
// app itself lives on printify.com (its /app/... pages are behind the login).
export function isPrintifyUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host === 'printify.com' || host.endsWith('.printify.com') || host.endsWith('.printify.me');
}

// Longest match first so C$/A$/S$ win over the bare $.
const CURRENCY_SYMBOLS: Array<[string, string]> = [
  ['C$', 'CAD'],
  ['A$', 'AUD'],
  ['S$', 'SGD'],
  ['CHF', 'CHF'],
  ['$', 'USD'],
  ['€', 'EUR'],
  ['£', 'GBP'],
  ['¥', 'JPY'],
];

const KNOWN_CODES = new Set(['USD', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'CHF', 'JPY']);

// "£12.40", "$27.10", "27.10 USD", "C$19.99" -> { amount, currency } or null
function parsePriceText(raw: string | null | undefined): { amount: number; currency: string } | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  const withCode = text.match(/^\s*([A-Z]{3})\s*([\d][\d.,]*)/);
  if (withCode && KNOWN_CODES.has(withCode[1])) {
    const amount = parseFloat(withCode[2].replace(/,/g, ''));
    return Number.isFinite(amount) && amount > 0 ? { amount, currency: withCode[1] } : null;
  }
  const codeAtEnd = text.match(/([\d][\d.,]*)\s*([A-Z]{3})\s*$/);
  if (codeAtEnd && KNOWN_CODES.has(codeAtEnd[2])) {
    const amount = parseFloat(codeAtEnd[1].replace(/,/g, ''));
    return Number.isFinite(amount) && amount > 0 ? { amount, currency: codeAtEnd[2] } : null;
  }
  for (const [symbol, currency] of CURRENCY_SYMBOLS) {
    const match = text.match(new RegExp(`^\\s*${symbol.replace(/[$€£¥]/g, (c) => `\\${c}`)}\\s*([\\d][\\d.,]*)`));
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      return Number.isFinite(amount) && amount > 0 ? { amount, currency } : null;
    }
  }
  const plain = text.match(/^([\d][\d.,]*)/);
  if (plain) {
    const amount = parseFloat(plain[1].replace(/,/g, ''));
    return Number.isFinite(amount) && amount > 0 ? { amount, currency: 'USD' } : null;
  }
  return null;
}

// Auto-detect category from product name (mirrors the shop's other importers).
function detectCategory(productName: string): string | undefined {
  const lower = productName.toLowerCase();
  if (lower.includes('coaster') || lower.includes('keychain')) return 'Keychains';
  if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('shirt') || /\btees?\b/.test(lower)) return 'T-shirts';
  if (lower.includes('art') || lower.includes('print') || lower.includes('poster')) return 'Art';
  if (lower.includes('digital') || lower.includes('ebook') || lower.includes('download') || lower.includes('pdf')) return 'Digital Downloads';
  return undefined;
}

// Parse a fetched Printify storefront product page (raw HTML). Returns null when
// the page is not a readable product page (e.g. a dashboard page, or the page
// failed to include the product data).
export function parsePrintifyStorefront(html: string, sourceUrl: URL): PrintifyParsedProduct | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const getMeta = (property: string): string | null => {
    const el = doc.querySelector(`meta[property="${property}"]`) || doc.querySelector(`meta[name="${property}"]`);
    return el?.getAttribute('content') ?? null;
  };

  const title = (getMeta('og:title') || doc.querySelector('title')?.textContent || '')
    .split('|')[0].split('–')[0].trim();
  const description = getMeta('og:description') || '';
  if (!title || !description) return null;

  const imageUrl = getMeta('og:image') || '';
  const images: string[] = [];
  if (imageUrl) {
    images.push(imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, sourceUrl.href).href);
  }

  const priceFromPage = parsePriceText(doc.querySelector('[data-testid="variantPrice"]')?.textContent);
  if (!priceFromPage) return null;

  return {
    name: title,
    description,
    price: priceFromPage.amount,
    currency: priceFromPage.currency,
    images,
    url: sourceUrl.href,
    category: detectCategory(title),
  };
}

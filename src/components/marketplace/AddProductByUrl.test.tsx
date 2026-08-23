import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddProductByUrl } from './AddProductByUrl';
import { isPrintifyUrl, parsePrintifyStorefront } from '@/utils/printifyStorefront';
import type { PrintifyParsedProduct } from '@/utils/printifyStorefront';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Minimal but realistic Printify storefront product page: OG meta for
// title/description/image, price only in the data-testid span (Printify emits
// no og:price:amount), and no store-name suffix in og:title.
function printifyPageHtml(priceText: string, overrides: Partial<Record<'title' | 'description', string>> = {}): string {
  return `<!doctype html><html><head>
<meta property="og:title" content="${overrides.title ?? 'Spirit Living Church Ministry Unisex Moisture Wicking Tee'}" />
<meta property="og:description" content="${overrides.description ?? 'A soft sport shirt for baptisms and outdoor summer events.'}" />
<meta property="og:image" content="https://images-api.printify.com/mockup/6674/83025/108043/tee.jpg?camera_label=person-1&amp;revision=1785247977651" />
<meta property="og:url" content="https://spirit-living-church-store.printify.me/product/9403076/spirit-living-church-ministry-unisex-tee" />
<meta property="og:type" content="website" />
</head><body><div class="space-y-4"><span class="text-2xl font-bold" data-testid="variantPrice">${priceText}</span></div></body></html>`;
}

function sampleUrl(overrides: Partial<{ title: string; description: string }> = {}): URL {
  return new URL(overrides.title || overrides.description
    ? 'https://your-store.printify.me/product/9403076/anything'
    : 'https://spirit-living-church-store.printify.me/product/9403076/spirit-living-church-ministry-unisex-tee');
}

describe('parsePrintifyStorefront', () => {
  it('extracts name, description, price, image and category from a storefront page', () => {
    const html = printifyPageHtml('$27.10');
    const parsed = parsePrintifyStorefront(html, sampleUrl());

    expect(parsed).not.toBeNull();
    expect(parsed!.name).toBe('Spirit Living Church Ministry Unisex Moisture Wicking Tee');
    expect(parsed!.description).toContain('baptisms');
    expect(parsed!.price).toBeCloseTo(27.1);
    expect(parsed!.currency).toBe('USD');
    expect(parsed!.category).toBe('T-shirts');
    // og:image entities are decoded (the real Printify URLs contain &amp;)
    expect(parsed!.images[0]).toBe('https://images-api.printify.com/mockup/6674/83025/108043/tee.jpg?camera_label=person-1&revision=1785247977651');
    expect(parsed!.url).toBe(sampleUrl().href);
  });

  it('handles EUR priced products', () => {
    const parsed = parsePrintifyStorefront(printifyPageHtml('€19.90'), sampleUrl());
    expect(parsed!.price).toBeCloseTo(19.9);
    expect(parsed!.currency).toBe('EUR');
  });

  it('handles a trailing currency code', () => {
    const parsed = parsePrintifyStorefront(printifyPageHtml('19.90 GBP'), sampleUrl());
    expect(parsed!.price).toBeCloseTo(19.9);
    expect(parsed!.currency).toBe('GBP');
  });

  it('returns null when the price is not rendered (e.g. dashboard/behind-login page)', () => {
    const html = printifyPageHtml('').replace('<span class="text-2xl font-bold" data-testid="variantPrice"></span>', '<span class="text-2xl font-bold" data-testid="variantPrice">Sign in to see price</span>');
    expect(parsePrintifyStorefront(html, sampleUrl())).toBeNull();
  });

  it('returns null when OG description is missing (marketing/app shell pages)', () => {
    const html = printifyPageHtml('$27.10', { description: '' });
    expect(parsePrintifyStorefront(html, sampleUrl({ description: '' }))).toBeNull();
  });

  it('strips the store suffix from the <title> when og:title is absent', () => {
    const html = printifyPageHtml('$12.00').replace(
      '<meta property="og:title" content="Spirit Living Church Ministry Unisex Moisture Wicking Tee" />',
      '<title>Spirit Living Church Ministry Unisex Moisture Wicking Tee | SPIRIT LIVING CHURCH Store</title>'
    );
    const parsed = parsePrintifyStorefront(html, sampleUrl()) as PrintifyParsedProduct;
    expect(parsed.name).toBe('Spirit Living Church Ministry Unisex Moisture Wicking Tee');
  });
});

describe('isPrintifyUrl', () => {
  it('recognises storefront and printify.com hosts', () => {
    expect(isPrintifyUrl(new URL('https://your-store.printify.me/product/9403076'))).toBe(true);
    expect(isPrintifyUrl(new URL('https://spirit-living-church-store.printify.me/'))).toBe(true);
    expect(isPrintifyUrl(new URL('https://printify.com/app/products'))).toBe(true);
    expect(isPrintifyUrl(new URL('https://www.printify.com/pop-up-store/'))).toBe(true);
  });

  it('rejects non-Printify hosts', () => {
    expect(isPrintifyUrl(new URL('https://www.storeofvalue.eu/products/cool-ostrich-t-shirt'))).toBe(false);
    expect(isPrintifyUrl(new URL('https://bitpopart.com/shop'))).toBe(false);
    expect(isPrintifyUrl(new URL('https://printify.evil.example/product/1'))).toBe(false);
  });
});

describe('AddProductByUrl Printify flow', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('loads a Printify storefront product via the CORS proxy and hands it to the form', async () => {
    const onProductScraped = vi.fn();
    // The only fetch the importer makes for a Printify URL: the CORS proxy call.
    // (fiatToSats -> coingecko happens after parsing; the mock just returns
    // the HTML for it too and the json() call fails silently -> no sats price.)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const href = typeof input === 'string' ? input : input.toString();
      if (href.includes('printify.me')) {
        return new Response(printifyPageHtml('$27.10'), { status: 200, headers: { 'Content-Type': 'text/html' } });
      }
      return new Response('{"status":"error"}', { status: 500 });
    }));

    render(<AddProductByUrl onProductScraped={onProductScraped} />);

    fireEvent.change(screen.getByPlaceholderText(/storeofvalue\.eu\/products/i), {
      target: { value: 'https://your-store.printify.me/product/1234/bitcoin-tee' },
    });
    fireEvent.click(screen.getByRole('button', { name: /load product from url/i }));

    await waitFor(() => {
      expect(onProductScraped).toHaveBeenCalledTimes(1);
    });
    const data = onProductScraped.mock.calls[0][0];
    expect(data.name).toBe('Spirit Living Church Ministry Unisex Moisture Wicking Tee');
    expect(data.price).toBeCloseTo(27.1);
    expect(data.currency).toBe('USD');
    expect(data.category).toBe('T-shirts');
  });

  it('shows a clear error for a dashboard (login-protected) Printify page', async () => {
    const onProductScraped = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () =>
      // Storefront shell with no product data (as seen for /app/... pages)
      new Response('<html><head><title>Printify Drop Shipping</title></head><body></body></html>', { status: 200 })
    ));

    render(<AddProductByUrl onProductScraped={onProductScraped} />);

    fireEvent.change(screen.getByPlaceholderText(/storeofvalue\.eu\/products/i), {
      target: { value: 'https://printify.com/app/products/1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /load product from url/i }));

    await waitFor(() => {
      expect(screen.getByText(/behind your login/i)).toBeInTheDocument();
    });
    expect(onProductScraped).not.toHaveBeenCalled();
  });
});

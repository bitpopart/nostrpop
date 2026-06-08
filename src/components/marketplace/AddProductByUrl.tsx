import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Link2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScrapedProductData {
  name: string;
  description: string;
  price: number;
  currency: string;
  priceInSats?: number;
  images: string[];
  url: string;
  category?: string;
}

interface AddProductByUrlProps {
  onProductScraped: (data: ScrapedProductData) => void;
}

interface ShopifyVariant {
  price: string;
  price_currency?: string;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  title: string;
  body_html: string;
  product_type?: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyProductResponse {
  product: ShopifyProduct;
}

// Strip HTML tags from a string and cap length for the product form
function stripHtml(html: string, maxLength = 2000): string {
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  // Truncate at last word boundary before the limit
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

// Auto-detect category from product name and type
function detectCategory(productName: string, productType?: string): string | undefined {
  const lower = (productName + ' ' + (productType || '')).toLowerCase();
  if (lower.includes('coaster')) return 'Keychains';
  if (lower.includes('keychain')) return 'Keychains';
  if (lower.includes('t-shirt') || lower.includes('tshirt') || lower.includes('shirt')) return 'T-shirts';
  if (lower.includes('art') || lower.includes('print') || lower.includes('poster')) return 'Art';
  if (lower.includes('digital') || lower.includes('ebook') || lower.includes('download') || lower.includes('pdf')) return 'Digital Downloads';
  return undefined;
}

// Convert fiat price to sats via CoinGecko
async function fiatToSats(price: number, currency: string): Promise<number | undefined> {
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'CHF', 'JPY'];
  if (price <= 0 || !supportedCurrencies.includes(currency.toUpperCase())) return undefined;
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`
    );
    const data = await response.json() as { bitcoin?: Record<string, number> };
    const btcPrice = data?.bitcoin?.[currency.toLowerCase()];
    if (btcPrice && btcPrice > 0) {
      return Math.round((price / btcPrice) * 100_000_000);
    }
  } catch (err) {
    console.warn('Failed to fetch BTC price for sats conversion:', err);
  }
  return undefined;
}

// Try fetching product data from a Shopify store's product JSON API
async function fetchShopifyProduct(parsedUrl: URL): Promise<ScrapedProductData | null> {
  // Shopify product URLs follow the pattern: /products/{handle}
  const match = parsedUrl.pathname.match(/^\/products\/([^/?#]+)/);
  if (!match) return null;

  const handle = match[1];
  const jsonUrl = `${parsedUrl.origin}/products/${handle}.json`;

  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) return null;

    const data = await response.json() as ShopifyProductResponse;
    const product = data?.product;
    if (!product?.title) return null;

    const variant = product.variants?.[0];
    const price = parseFloat(variant?.price ?? '0') || 0;
    const currency = (variant?.price_currency ?? 'EUR').toUpperCase();
    const images = (product.images ?? []).map((img) => img.src).filter(Boolean);
    const description = stripHtml(product.body_html ?? '');
    const category = detectCategory(product.title, product.product_type);
    const priceInSats = await fiatToSats(price, currency);

    return {
      name: product.title,
      description: description || product.title,
      price,
      currency,
      priceInSats,
      images,
      url: parsedUrl.href,
      category,
    };
  } catch (err) {
    console.warn('Shopify JSON API fetch failed:', err);
    return null;
  }
}

// Fallback: scrape OG meta tags via CORS proxy
async function fetchViaOgMeta(rawUrl: string): Promise<ScrapedProductData> {
  const corsProxy = 'https://proxy.shakespeare.diy/?url=';
  const response = await fetch(corsProxy + encodeURIComponent(rawUrl), { signal: AbortSignal.timeout(15000) });

  if (!response.ok) {
    throw new Error(`Failed to fetch product page (HTTP ${response.status}). Try entering the URL directly from storeofvalue.eu.`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getMeta = (property: string): string | null => {
    const el = doc.querySelector(`meta[property="${property}"]`) ||
               doc.querySelector(`meta[name="${property}"]`);
    return el?.getAttribute('content') ?? null;
  };

  const title = getMeta('og:title') || doc.querySelector('title')?.textContent || '';
  const description = getMeta('og:description') || getMeta('description') || '';
  const imageUrl = getMeta('og:image') || '';
  const priceAmount = getMeta('og:price:amount') || getMeta('product:price:amount') || '';
  const priceCurrency = (getMeta('og:price:currency') || getMeta('product:price:currency') || 'USD').toUpperCase();

  const cleanTitle = title.split('|')[0].split('–')[0].trim();
  const price = parseFloat(priceAmount) || 0;

  if (!cleanTitle || !description) {
    throw new Error('Could not extract product information from the page. Make sure the URL points to a product page.');
  }

  const images: string[] = [];
  if (imageUrl) {
    images.push(imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, rawUrl).href);
  }

  const priceInSats = await fiatToSats(price, priceCurrency);

  return {
    name: cleanTitle,
    description,
    price,
    currency: priceCurrency,
    priceInSats,
    images,
    url: rawUrl,
    category: detectCategory(cleanTitle),
  };
}

export function AddProductByUrl({ onProductScraped }: AddProductByUrlProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScrapeUrl = async () => {
    if (!url.trim()) {
      toast({ title: 'URL Required', description: 'Please enter a product URL.', variant: 'destructive' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid URL starting with https://', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let scrapedData: ScrapedProductData | null = null;

      // 1. Try Shopify JSON API first (works for storeofvalue.eu and any Shopify store)
      scrapedData = await fetchShopifyProduct(parsedUrl);

      // 2. Fall back to OG meta scraping via CORS proxy
      if (!scrapedData) {
        scrapedData = await fetchViaOgMeta(parsedUrl.href);
      }

      onProductScraped(scrapedData);

      toast({
        title: 'Product Data Loaded!',
        description: scrapedData.priceInSats
          ? `Loaded "${scrapedData.name}". Price: ${scrapedData.price} ${scrapedData.currency} (≈${scrapedData.priceInSats.toLocaleString()} sats)`
          : `Successfully loaded "${scrapedData.name}" from URL.`,
      });

      setUrl('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product data';
      setError(errorMessage);
      toast({ title: 'Failed to Load Product', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
          <Link2 className="h-5 w-5 mr-2" />
          Add Product by URL
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          Import product data from storeofvalue.eu or any Shopify store
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="product-url">Product URL</Label>
          <Input
            id="product-url"
            type="url"
            placeholder="https://www.storeofvalue.eu/products/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScrapeUrl()}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Example: https://www.storeofvalue.eu/products/nostr-coaster-hang-loose-by-bitpopart
          </p>
        </div>

        <Button
          onClick={handleScrapeUrl}
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Product Data...
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Load Product from URL
            </>
          )}
        </Button>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Paste a product URL from storeofvalue.eu (or any Shopify store) and we'll automatically import the title, description, price, and all product images.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

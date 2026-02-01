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

export function AddProductByUrl({ onProductScraped }: AddProductByUrlProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScrapeUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a product URL.",
        variant: "destructive"
      });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use CORS proxy to fetch the page
      const corsProxy = 'https://proxy.shakespeare.diy/?url=';
      const response = await fetch(corsProxy + encodeURIComponent(url));
      
      if (!response.ok) {
        throw new Error('Failed to fetch product page');
      }

      const html = await response.text();
      
      // Parse HTML to extract product data
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract Open Graph metadata
      const getMetaContent = (property: string): string | null => {
        const meta = doc.querySelector(`meta[property="${property}"]`) || 
                     doc.querySelector(`meta[name="${property}"]`);
        return meta?.getAttribute('content') || null;
      };

      const title = getMetaContent('og:title') || doc.querySelector('title')?.textContent || '';
      const description = getMetaContent('og:description') || getMetaContent('description') || '';
      const imageUrl = getMetaContent('og:image') || '';
      const priceAmount = getMetaContent('og:price:amount') || getMetaContent('product:price:amount') || '';
      const priceCurrency = getMetaContent('og:price:currency') || getMetaContent('product:price:currency') || 'USD';

      // Clean up title (remove site name if present)
      const cleanTitle = title.split('|')[0].split('–')[0].trim();

      // Parse price
      const price = parseFloat(priceAmount) || 0;

      // Convert price to Sats if it's in fiat currency
      let priceInSats: number | undefined;
      if (price > 0 && ['USD', 'EUR', 'GBP', 'SGD'].includes(priceCurrency)) {
        try {
          // Fetch BTC price in the currency
          const btcPriceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${priceCurrency.toLowerCase()}`);
          const btcPriceData = await btcPriceResponse.json();
          const btcPrice = btcPriceData?.bitcoin?.[priceCurrency.toLowerCase()];
          
          if (btcPrice && btcPrice > 0) {
            const priceInBTC = price / btcPrice;
            priceInSats = Math.round(priceInBTC * 100000000); // Convert to satoshis
          }
        } catch (error) {
          console.warn('Failed to fetch BTC price for conversion:', error);
        }
      }

      // Collect images
      const images: string[] = [];
      if (imageUrl) {
        // Ensure image URL is absolute
        const absoluteImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : new URL(imageUrl, url).href;
        images.push(absoluteImageUrl);
      }

      // Auto-detect category from product name
      const detectCategory = (productName: string): string | undefined => {
        const lowerName = productName.toLowerCase();
        if (lowerName.includes('coaster') || lowerName.includes('keychain')) return 'Keychains';
        if (lowerName.includes('t-shirt') || lowerName.includes('tshirt') || lowerName.includes('shirt')) return 'T-shirts';
        if (lowerName.includes('art') || lowerName.includes('print') || lowerName.includes('poster')) return 'Art';
        if (lowerName.includes('digital') || lowerName.includes('ebook') || lowerName.includes('download') || lowerName.includes('pdf')) return 'Digital Downloads';
        return undefined;
      };

      const detectedCategory = detectCategory(cleanTitle);

      // Validate scraped data
      if (!cleanTitle || !description) {
        throw new Error('Could not extract product information from the page. Make sure the URL is a valid product page.');
      }

      const scrapedData: ScrapedProductData = {
        name: cleanTitle,
        description: description,
        price: price,
        currency: priceCurrency,
        priceInSats: priceInSats,
        images: images,
        url: url,
        category: detectedCategory
      };

      // Pass data to parent component
      onProductScraped(scrapedData);

      toast({
        title: "Product Data Loaded!",
        description: priceInSats 
          ? `Successfully loaded "${cleanTitle}". Price: ${price} ${priceCurrency} (≈${priceInSats.toLocaleString()} sats)`
          : `Successfully loaded "${cleanTitle}" from URL.`,
      });

      // Clear form
      setUrl('');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product data';
      setError(errorMessage);
      toast({
        title: "Failed to Load Product",
        description: errorMessage,
        variant: "destructive"
      });
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
          Import product data from storeofvalue.eu or any website with Open Graph metadata
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
            <strong>How it works:</strong> Enter a product URL and we'll automatically extract the title, description, price, and images using Open Graph metadata.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

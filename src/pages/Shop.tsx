import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAppMedia } from '@/hooks/useAppContent';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginArea } from '@/components/auth/LoginArea';
import { RelaySelector } from '@/components/RelaySelector';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ProductManagement } from '@/components/marketplace/ProductManagement';
import { LightningStatusIndicator } from '@/components/marketplace/LightningStatusIndicator';
import { CartDrawer } from '@/components/marketplace/CartDrawer';
import { FundraiserCard } from '@/components/fundraiser/FundraiserCard';
import { FundraiserManagement } from '@/components/fundraiser/FundraiserManagement';
import { useFundraisers } from '@/hooks/useFundraisers';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Grid3X3,
  List,
  Zap,
  Target,
  Download,
  Gift,
  Printer,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  RefreshCw,
  Star,
} from 'lucide-react';

import { useCategories } from '@/hooks/useCategories';
import { useShopTags } from '@/hooks/useShopTags';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';
import { usePrintPosters, useBtcEurRate, eurToLiveSats } from '@/hooks/usePrintPosters';
import type { PrintPoster, PosterFormat } from '@/hooks/usePrintPosters';
import { usePublishToMarketplace, NOSTR_MARKETPLACES } from '@/hooks/usePublishToMarketplace';
import type { MarketplaceProduct } from '@/lib/sampleProducts';
import { Store, Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// ── Shop Image Carousel ────────────────────────────────────

interface CarouselItem {
  id: string;
  image_url: string;
  title: string;
}

function ShopCarousel({ items, isLoading }: { items: CarouselItem[]; isLoading: boolean }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex(i => (i + 1) % items.length);
      }, 3500);
    }
  }, [items.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const prev = () => { setIndex(i => (i - 1 + items.length) % items.length); resetTimer(); };
  const next = () => { setIndex(i => (i + 1) % items.length); resetTimer(); };

  if (isLoading) {
    return <Skeleton className="w-full aspect-[4/3] rounded-2xl" />;
  }

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[index];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden group max-h-[320px] sm:max-h-[400px]">
      {/* Invisible spacer image keeps the container sized to the active image's natural dimensions */}
      <img
        key={currentItem.id + '-spacer'}
        src={currentItem.image_url}
        alt=""
        aria-hidden="true"
        className="w-full h-auto block opacity-0 pointer-events-none max-h-[320px] sm:max-h-[400px] object-contain"
      />
      {items.map((it, i) => (
        <img
          key={it.id}
          src={it.image_url}
          alt={it.title}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      {/* Nav buttons */}
      {items.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
              onClick={() => { setIndex(i); resetTimer(); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Broadcast All Banner (admin-only) ──────────────────────────────────────────

function BroadcastAllBanner({ products }: { products: MarketplaceProduct[] }) {
  const { publishProduct, publishStatuses } = usePublishToMarketplace();
  const [done, setDone] = useState(false);

  const isAnyPublishing = products.some(p => publishStatuses[p.id]?.isPublishing);
  const publishedCount = products.filter(p => {
    const results = publishStatuses[p.id]?.results ?? [];
    return results.some(r => r.success);
  }).length;

  const handleBroadcastAll = async () => {
    setDone(false);
    const allIds = NOSTR_MARKETPLACES.map(m => m.id);
    for (const product of products) {
      await publishProduct(product, allIds);
    }
    setDone(true);
  };

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/20">
      <div className="flex items-start gap-3">
        <Store className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm text-purple-800 dark:text-purple-200">
            Broadcast to Nostr Marketplaces
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
            Publish all {products.length} products as <strong>NIP-99</strong> (kind 30402) listings to Shopstr, Plebeian Market &amp; Conduit Market.
          </p>
          {done && publishedCount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {publishedCount}/{products.length} products broadcast successfully
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Per-marketplace quick links */}
        <div className="hidden md:flex gap-1.5">
          {NOSTR_MARKETPLACES.map(m => (
            <a
              key={m.id}
              href={m.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border font-medium ${m.colorLight} hover:opacity-80 transition-opacity`}
              title={`View on ${m.name}`}
            >
              {m.logo} {m.name}
            </a>
          ))}
        </div>
        <Button
          size="sm"
          onClick={handleBroadcastAll}
          disabled={isAnyPublishing || products.length === 0}
          className="gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 whitespace-nowrap"
        >
          {isAnyPublishing ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Broadcasting…</>
          ) : done ? (
            <><RefreshCw className="h-3.5 w-3.5" />Re-broadcast All</>
          ) : (
            <><Send className="h-3.5 w-3.5" />Broadcast All</>
          )}
        </Button>
      </div>
    </div>
  );
}

const Shop = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getGradientStyle } = useThemeColors();
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  // Fetch shop carousel images (separate from the /app carousel)
  const { data: carouselMedia = [], isLoading: carouselLoading } = useAppMedia('shop-carousel');

  // Check if current user is admin
  const isAdmin = useIsAdmin();

  // Admin-created categories (localStorage via useCategories)
  const { categoryNames } = useCategories();
  // Admin-curated tag library — only show visible tags in the cloud
  const { visibleTags: visibleShopTags } = useShopTags();
  // Featured/pinned products (admin-chosen order shown first)
  const { featuredIds } = useFeaturedProducts();

  // Get initial tab from URL params
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'admin' && isAdmin) return 'admin';
    if (tabParam === 'fundraiser-admin' && isAdmin) return 'fundraiser-admin';
    if (tabParam === 'fundraisers') return 'fundraisers';
    if (tabParam === 'print-posters') return 'print-posters';
    return 'marketplace';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Get initial category from URL params
  // Default to 'featured' so featured products show first for everyone;
  // falls back to 'all' only when explicitly set via URL
  const initialCategory = searchParams.get('category') || 'featured';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Update tab when URL params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'admin' && isAdmin) {
      setActiveTab('admin');
    } else if (tabParam === 'fundraiser-admin' && isAdmin) {
      setActiveTab('fundraiser-admin');
    } else if (tabParam === 'fundraisers') {
      setActiveTab('fundraisers');
    } else if (tabParam === 'print-posters') {
      setActiveTab('print-posters');
    } else {
      setActiveTab('marketplace');
    }
  }, [searchParams, isAdmin]);

  // Update category when URL params change
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      // No category param → keep 'featured' as default so featured products
      // are shown first for everyone on a clean page load
      setSelectedCategory('featured');
    }
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch ALL marketplace products (category filtering done client-side)
  const { data: allProducts, isLoading: productsLoading, error: productsError } = useMarketplaceProducts();

  // Tabs = only the admin-created categories (from useCategories / localStorage)
  // Count how many products match each category name (case-insensitive against p.category)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts?.forEach(p => {
      const key = p.category.toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [allProducts]);

  // Tag cloud: count all keyword tags from products
  // If the admin has a visible tag library, filter to only those + respect their order.
  // If no library exists (e.g. visitor on a different browser), show all product tags sorted by count.
  const tagCounts = useMemo(() => {
    // Count every tag that actually appears on at least one product
    const counts: Record<string, number> = {};
    allProducts?.forEach(p => {
      const kwTags = (p as { keyword_tags?: string[] }).keyword_tags ?? [];
      kwTags.forEach(tag => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      });
    });

    if (visibleShopTags.length > 0) {
      // Admin has a library: show visible library tags (even 0-count ones so admin sees all),
      // filtered to those that exist in product data or are in the library
      return visibleShopTags.map(({ tag }) => ({ tag, count: counts[tag] ?? 0 }));
    }

    // No library / visitor browser: derive tags directly from products, sort by count desc
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [allProducts, visibleShopTags]);

  // Filter products by selected category AND selected tag, then apply featured ordering
  const products = useMemo(() => {
    if (!allProducts) return allProducts;
    let filtered = allProducts;

    if (selectedCategory === 'featured') {
      // Show only featured products (in admin-chosen order)
      if (featuredIds.length > 0) {
        filtered = featuredIds
          .map(id => allProducts.find(p => p.id === id))
          .filter((p): p is NonNullable<typeof p> => p !== undefined);
      } else {
        // No featured products defined yet — fall through to show all
        filtered = allProducts;
      }
    } else if (selectedCategory !== 'all') {
      const needle = selectedCategory.toLowerCase();
      filtered = filtered.filter(p => p.category.toLowerCase() === needle);
    }

    if (selectedTag) {
      const needle = selectedTag.toLowerCase();
      filtered = filtered.filter(p => {
        const kwTags = (p as { keyword_tags?: string[] }).keyword_tags ?? [];
        return kwTags.some(t => t.toLowerCase() === needle);
      });
    }

    // For non-featured views: apply featured pinning so featured products appear first
    if (selectedCategory !== 'featured' && featuredIds.length > 0) {
      const featuredSet = new Set(featuredIds);
      const pinned = featuredIds
        .map(id => filtered.find(p => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);
      const rest = filtered.filter(p => !featuredSet.has(p.id));
      return [...pinned, ...rest];
    }

    return filtered;
  }, [allProducts, selectedCategory, selectedTag, featuredIds]);

  // Fetch fundraisers
  const { data: fundraisers = [], isLoading: fundraisersLoading } = useFundraisers();

  // Fetch print posters
  const { data: printPosters = [], isLoading: printersLoading } = usePrintPosters();
  const { data: btcRate } = useBtcEurRate();

  // Print posters tab: category filter
  const [posterCategory, setPosterCategory] = useState<string>('all');
  const posterCategories = Array.from(new Set(printPosters.map((p: PrintPoster) => p.category).filter(Boolean)));
  const filteredPosters = posterCategory === 'all' ? printPosters : printPosters.filter((p: PrintPoster) => p.category === posterCategory);

  useSeoMeta({
    title: 'Shop - BitPopArt Marketplace | Buy Bitcoin Pop Art',
    description: 'Nostr-powered marketplace for physical and digital products. Buy exclusive Bitcoin pop art, digital prints, and merchandise. Pay with Bitcoin Lightning. By BitPopArt.',
    keywords: 'bitcoin art shop, pop art for sale, bitcoin marketplace, nostr shop, buy digital art, bitcoin lightning payment, bitpopart shop, digital prints, art merchandise',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Shop - BitPopArt Marketplace | Buy Bitcoin Pop Art',
    ogDescription: 'Nostr-powered marketplace for physical and digital products. Buy exclusive Bitcoin pop art and digital prints. Pay with Bitcoin Lightning.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogImageAlt: 'BitPopArt Shop',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/shop',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Shop - BitPopArt Marketplace | Buy Bitcoin Pop Art',
    twitterDescription: 'Nostr-powered marketplace. Buy exclusive Bitcoin pop art and digital prints. Pay with Bitcoin Lightning.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  // Everyone can browse the marketplace, but login is required for purchases

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={`${import.meta.env.BASE_URL || '/'}Shop_button_1.svg`}
                alt="Shop"
                className="h-9 w-9 flex-shrink-0"
              />
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight gradient-header-text truncate">
                BitPop Marketplace
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <LightningStatusIndicator />
              {/* Cart button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCartOpen(true)}
                className="relative gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Button>
              {user && isAdmin && (
                <Badge
                  className="hidden sm:inline-flex text-white border-0 text-xs"
                  style={getGradientStyle('primary')}
                >
                  Admin
                </Badge>
              )}
            </div>
          </div>

          {/* Lightning address row */}
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Pay via Lightning: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">bitpopart@walletofsatoshi.com</code></span>
          </div>

          {/* Carousel — constrained to same width as content, capped height */}
          {(carouselLoading || carouselMedia.length > 0) && (
            <div className="mb-4">
              <ShopCarousel items={carouselMedia} isLoading={carouselLoading} />
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 mb-5">
            <Button
              size="sm"
              onClick={() => navigate('/free')}
              className="gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-sm"
            >
              <Gift className="h-4 w-4" />
              Free Downloads
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          {isAdmin ? (
            <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto mb-5">
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="print-posters" className="gap-1"><Printer className="h-3.5 w-3.5" />Print Posters</TabsTrigger>
              <TabsTrigger value="fundraisers">Fundraisers</TabsTrigger>
              <TabsTrigger value="admin">Products</TabsTrigger>
              <TabsTrigger value="fundraiser-admin">Fundraiser Admin</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto mb-5">
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="print-posters" className="gap-1"><Printer className="h-3.5 w-3.5" />Print Posters</TabsTrigger>
              <TabsTrigger value="fundraisers">Fundraisers</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="marketplace">
            <div className="space-y-4">
              {/* Login Prompt for Non-Logged-In Users */}
              {!user && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300 text-sm mb-0.5">
                          Browse &amp; Buy — No Login Required
                        </h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          Pay with Bitcoin Lightning ⚡ — or log in with Nostr for extra features
                        </p>
                      </div>
                      <LoginArea className="max-w-48" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Broadcast Banner — Admin Only */}
              {isAdmin && allProducts && allProducts.length > 0 && (
                <BroadcastAllBanner products={allProducts} />
              )}

              {/* Toolbar: Add Product + View toggle + RelaySelector */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {user && isAdmin && (
                    <Button onClick={() => setActiveTab('admin')} variant="outline" size="sm">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Product
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  </Button>
                </div>
                <RelaySelector />
              </div>

              {/* ── Tag Cloud ─────────────────────────────────────────── */}
              {tagCounts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                    <span className="font-medium">Filter by tag</span>
                    {selectedTag && (
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        className="ml-2 flex items-center gap-0.5 text-orange-600 hover:text-orange-800 font-semibold"
                      >
                        <X className="h-3 w-3" />
                        Clear #{selectedTag}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tagCounts.map(({ tag, count }) => {
                      const isActive = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(isActive ? null : tag)}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all font-medium
                            ${isActive
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-white dark:bg-gray-800 text-muted-foreground border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:text-orange-600'
                            }`}
                        >
                          #{tag}
                          <span className={`text-[10px] ${isActive ? 'text-orange-100' : 'text-muted-foreground'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Category tab bar — plain buttons, avoids nesting inside outer Tabs ── */}
              <div className="w-full">
                <div className="overflow-x-auto pb-px">
                  <div className="inline-flex h-9 w-max min-w-full border-b border-border gap-0">
                    {/* Featured tab — shown whenever featured IDs exist */}
                    {featuredIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedCategory('featured'); setSelectedTag(null); }}
                        className={`relative h-9 border-b-2 px-4 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5
                          ${selectedCategory === 'featured'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Featured
                        <span className="ml-0.5 text-xs text-muted-foreground">{featuredIds.length}</span>
                      </button>
                    )}

                    {/* All tab */}
                    <button
                      type="button"
                      onClick={() => { setSelectedCategory('all'); setSelectedTag(null); }}
                      className={`relative h-9 border-b-2 px-4 text-sm font-medium transition-colors whitespace-nowrap
                        ${selectedCategory === 'all'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                      All
                      {allProducts && (
                        <span className="ml-1.5 text-xs text-muted-foreground">{allProducts.length}</span>
                      )}
                    </button>

                    {/* One tab per admin-created category */}
                    {categoryNames.map(cat => {
                      const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                      const count = categoryCounts[cat.toLowerCase()] ?? 0;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setSelectedCategory(cat); setSelectedTag(null); }}
                          className={`relative h-9 border-b-2 px-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${isActive
                              ? 'border-orange-500 text-orange-600'
                              : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                          {cat}
                          {count > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Products panel */}
                <div className="mt-4">
                  {productsLoading && (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-square"><Skeleton className="w-full h-full" /></div>
                          <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                              <div className="flex justify-between items-center pt-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-8 w-16" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {productsError && (
                    <Card className="border-dashed border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                      <CardContent className="py-12 px-8 text-center">
                        <div className="max-w-sm mx-auto space-y-6">
                          <ShoppingCart className="h-12 w-12 mx-auto text-red-500" />
                          <div>
                            <CardTitle className="text-red-600 dark:text-red-400 mb-2">Failed to Load Products</CardTitle>
                            <CardDescription>Unable to fetch marketplace products. Try switching to a different relay.</CardDescription>
                          </div>
                          <RelaySelector className="w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!productsLoading && !productsError && products && products.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-12 px-8 text-center">
                        <div className="max-w-sm mx-auto space-y-6">
                          <ShoppingCart className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <CardTitle className="mb-2">No Products Found</CardTitle>
                            <CardDescription>
                              {selectedTag
                                ? `No products tagged #${selectedTag}${selectedCategory !== 'all' && selectedCategory !== 'featured' ? ` in "${selectedCategory}"` : ''}. Try clearing the tag filter.`
                                : selectedCategory === 'featured'
                                ? 'No featured products have been set yet. Browse all products below.'
                                : selectedCategory !== 'all'
                                ? `No products tagged "${selectedCategory}". Try a different tab or relay.`
                                : 'No products have been listed yet. Try switching to a different relay or be the first to list a product!'}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <RelaySelector className="flex-1" />
                            {user && isAdmin && (
                              <Button size="sm" onClick={() => setActiveTab('admin')}>
                                <Plus className="mr-2 h-4 w-4" />
                                List Product
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!productsLoading && products && products.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{products.length} product{products.length !== 1 ? 's' : ''}</span>
                        {selectedCategory === 'featured' && <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current text-orange-400" />featured</span>}
                        {selectedCategory !== 'all' && selectedCategory !== 'featured' && <span>in "{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}"</span>}
                        {selectedTag && (
                          <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                            <Tag className="h-3 w-3" />#{selectedTag}
                            <button type="button" onClick={() => setSelectedTag(null)} className="hover:text-red-600 ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </p>
                      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {products.map((product) => {
                          const isFeatured = featuredIds.includes(product.id);
                          return (
                            <div key={product.id} className={`relative ${isFeatured ? 'ring-2 ring-orange-400 ring-offset-2 rounded-2xl' : ''}`}>
                              {isFeatured && (
                                <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md" title="Featured product">
                                  <Star className="h-3.5 w-3.5 fill-white" />
                                </div>
                              )}
                              <ProductCard
                                product={product}
                                onViewDetails={(p) => { console.log('View:', p); }}
                              />
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="print-posters">
            <div className="space-y-4">
              {/* Print Posters header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold">Print Posters</h2>
                  <Badge variant="outline" className="text-xs">A3 · A4 · A5 · A6</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Pay with Bitcoin Lightning — print at home or at any print shop</p>
              </div>

              {/* Category filter for posters — inline, no card */}
              {posterCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium flex-shrink-0">Filter by category:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setPosterCategory('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${posterCategory === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}
                    >
                      All
                    </button>
                    {posterCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPosterCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${posterCategory === cat ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Posters grid */}
              {printersLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {!printersLoading && filteredPosters.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <Printer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <CardTitle className="mb-2">No Posters Found</CardTitle>
                    <CardDescription>
                      {posterCategory !== 'all' ? `No posters in the "${posterCategory}" category.` : 'No print posters have been added yet.'}
                    </CardDescription>
                  </CardContent>
                </Card>
              )}

              {!printersLoading && filteredPosters.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">{filteredPosters.length} poster design{filteredPosters.length !== 1 ? 's' : ''}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredPosters.map((poster: PrintPoster) => {
                      const a4 = poster.formats.find((f: { format: PosterFormat }) => f.format === 'A4');
                      const liveSats = btcRate && a4 ? eurToLiveSats(a4.priceEur, btcRate) : a4?.priceSats;
                      return (
                        <div
                          key={poster.id}
                          className="group cursor-pointer rounded-xl overflow-hidden border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => navigate('/print')}
                        >
                          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <img
                              src={poster.previewUrl}
                              alt={poster.title}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2.5">
                            <p className="text-sm font-semibold truncate">{poster.title}</p>
                            {poster.category && (
                              <p className="text-xs text-muted-foreground truncate mb-1">{poster.category}</p>
                            )}
                            {a4 && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                                €{a4.priceEur}
                                {liveSats && (
                                  <span className="text-yellow-600 flex items-center gap-0.5 ml-1">
                                    <Zap className="h-2.5 w-2.5" />{liveSats.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                            <Badge variant="outline" className="text-[10px] mt-1.5">A3·A4·A5·A6</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" className="w-full gap-2 mt-2" onClick={() => navigate('/print')}>
                    <Printer className="h-4 w-4" />
                    Go to Full Print Shop
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fundraisers">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-purple-600 mr-3" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Fundraising Campaigns
                  </h2>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Support new art projects and creative ventures with Bitcoin
                </p>
              </div>

              {/* Fundraisers Display */}
              {fundraisersLoading && (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-video">
                        <Skeleton className="w-full h-full" />
                      </div>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {fundraisers.length === 0 && !fundraisersLoading && (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <Target className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <CardTitle className="mb-2">No Fundraisers Yet</CardTitle>
                        <CardDescription>
                          Check back soon for new crowdfunding campaigns, or try a different relay.
                        </CardDescription>
                      </div>
                      <RelaySelector className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {fundraisers.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {fundraisers.length} active campaign{fundraisers.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {fundraisers.map((fundraiser) => (
                      <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {user && isAdmin && (
            <>
              <TabsContent value="admin">
                <ProductManagement />
              </TabsContent>

              <TabsContent value="fundraiser-admin">
                <FundraiserManagement />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Shop;
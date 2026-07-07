import { useState, useMemo } from 'react';
import { NOSTR_MARKETPLACES, ADMIN_NPUB, ADMIN_HEX_PUBKEY, getLastPublished } from '@/hooks/usePublishToMarketplace';
import { useMarketplaceProducts, useDeleteProduct } from '@/hooks/useMarketplaceProducts';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreateProductForm } from './CreateProductForm';
import { EditProductForm } from './EditProductForm';
import { AddProductByUrl } from './AddProductByUrl';
import { LightningAddressDebugger } from './LightningAddressDebugger';
import { CategoryManagement } from './CategoryManagement';
import { PublishToMarketplaces } from './PublishToMarketplaces';
import { OrdersManagement } from './OrdersManagement';
import { ShippingConfigAdmin } from './ShippingConfigAdmin';
import { ShippingOptionsAdmin } from './ShippingOptionsAdmin';
import { OrderMessaging } from './OrderMessaging';
import { StockManagement } from './StockManagement';
import { formatCurrency } from '@/hooks/usePayment';
import { useToast } from '@/hooks/useToast';
import type { MarketplaceProduct } from '@/lib/sampleProducts';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Download,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Store,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ClipboardList,
  Truck,
  BarChart2,
  MessageSquare,
} from 'lucide-react';

import { useCategories } from '@/hooks/useCategories';

/** Bulk publish panel shown in the Marketplaces tab */
function BulkPublishPanel({ products }: { products: MarketplaceProduct[] }) {
  const [panelTab, setPanelTab] = useState<'products' | 'shops' | 'bulk-updater'>('products');

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex-shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-purple-700 dark:text-purple-300 text-lg leading-tight">
                Publish Merch to Nostr Marketplaces
              </h2>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                 Click <strong>"Publish to Markets"</strong> on any product below to broadcast it
                 to Shopstr, Plebeian Market, and Conduit Market simultaneously.
                 Your listing appears everywhere buyers are shopping — no account on each platform needed.
              </p>
            </div>
          </div>

          {/* Marketplace quick-link row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {NOSTR_MARKETPLACES.map((market) => (
              <a
                key={market.id}
                href={market.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-purple-100 dark:border-purple-900 hover:shadow-md hover:border-purple-300 transition-all group"
              >
                <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r ${market.color} text-white text-sm flex-shrink-0`}>
                  {market.logo}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">{market.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    My Shop <ArrowUpRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs */}
      <div className="flex border-b flex-wrap">
        {([
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'shops', label: 'My Shop Pages', icon: Store },
          { id: 'bulk-updater', label: 'Bulk Updater', icon: ArrowUpRight },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPanelTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${
              panelTab === id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Products list */}
      {panelTab === 'products' && (
        <div>
          {products.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-muted-foreground">No products found. Create some products first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                // Check published status across all marketplaces
                const publishedMarkets = NOSTR_MARKETPLACES.filter(
                  (m) => getLastPublished(product.id, m.id)?.success
                );

                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Thumbnail */}
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0 border">
                          {product.type === 'digital'
                            ? <Download className="h-5 w-5 text-gray-400" />
                            : <Package className="h-5 w-5 text-gray-400" />}
                        </div>
                      )}

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {product.type === 'digital' ? '⬇️ Digital' : '📦 Physical'}
                          </Badge>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {product.price} {product.currency}
                          </span>
                        </div>

                        {/* Published status indicators */}
                        {publishedMarkets.length > 0 ? (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">Live on:</span>
                            {publishedMarkets.map((m) => {
                              const entry = getLastPublished(product.id, m.id);
                              return (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                >
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  {m.logo} {m.name}
                                  {entry && (
                                    <span className="text-green-500 dark:text-green-500 ml-0.5">
                                      · {new Date(entry.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Not yet published to any marketplace</span>
                          </div>
                        )}
                      </div>

                      {/* Publish button */}
                      <div className="flex-shrink-0">
                        <PublishToMarketplaces product={product} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My shop pages */}
      {panelTab === 'shops' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These are your direct BitPopArt seller profile pages on each Nostr marketplace.
            Once you publish a product, it appears on all of these pages automatically.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {NOSTR_MARKETPLACES.map((market) => {
              const publishedCount = products.filter(
                (p) => getLastPublished(p.id, market.id)?.success
              ).length;

              return (
                <Card key={market.id} className={`border overflow-hidden ${market.colorLight}`}>
                  <CardContent className="p-0">
                    {/* Colored top bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${market.color}`} />
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r ${market.color} text-white text-xl flex-shrink-0 shadow-sm`}>
                          {market.logo}
                        </span>
                        <div>
                          <p className="font-bold">{market.name}</p>
                          <p className="text-xs text-muted-foreground">{market.description}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        {publishedCount > 0 ? (
                          <Badge className="bg-green-500 text-white border-0 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {publishedCount} product{publishedCount !== 1 ? 's' : ''} published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            No products published yet
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          {market.formats.map((fmt) => (
                            <Badge key={fmt} variant="outline" className="text-[10px] py-0">
                              {fmt === 'nip99' ? 'NIP-99' : 'NIP-15'}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="space-y-2">
                        <a
                          href={market.shopUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 border hover:shadow-sm transition-all group"
                        >
                          <div>
                            <p className="text-sm font-semibold">My BitPopArt Shop</p>
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                              {market.shopUrl.replace('https://', '')}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        </a>
                        <a
                          href={market.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 dark:bg-gray-800/40 border hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all group"
                        >
                          <p className="text-xs text-muted-foreground">Browse {market.name}</p>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </a>
                      </div>

                      {/* Relay tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {market.relays.map((relay) => (
                          <span key={relay} className="text-[10px] bg-white/60 dark:bg-gray-800/60 border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                            {relay.replace('wss://', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Nostr key reference */}
          <Card className="bg-muted/30 border">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Nostr Identity (used on all marketplaces)</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-10 flex-shrink-0">npub</span>
                  <code className="text-xs bg-white dark:bg-gray-800 border px-2 py-1 rounded font-mono break-all flex-1">
                    {ADMIN_NPUB}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-10 flex-shrink-0">hex</span>
                  <code className="text-xs bg-white dark:bg-gray-800 border px-2 py-1 rounded font-mono break-all flex-1">
                    {ADMIN_HEX_PUBKEY}
                  </code>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Your Nostr public key is your merchant identity. All marketplace clients use it to show your shop — no separate account creation required on each platform.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Updater tab */}
      {panelTab === 'bulk-updater' && (
        <div className="space-y-4">
          {/* Info banner */}
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex-shrink-0 mt-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-bold text-purple-700 dark:text-purple-300 text-base leading-tight">
                      Gamma Markets Bulk Updater
                    </h3>
                    <a
                      href="https://nip99-bulk-updater.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open full screen
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bulk edit your NIP-99 listings in a spreadsheet view. This is an external tool —
                    it needs its own one-click login via your <strong>Nostr browser extension</strong> (Alby, nos2x, etc.).
                    No password needed — just click <strong>"Log in"</strong> inside the tool and your extension signs in instantly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embedded tool */}
          <div className="rounded-lg border border-purple-200 dark:border-purple-800 overflow-hidden shadow-sm">
            <iframe
              src="https://nip99-bulk-updater.vercel.app/"
              className="w-full"
              style={{ height: '78vh', minHeight: '520px' }}
              title="Gamma Markets Bulk Updater"
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductManagement() {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
  const [importedProductData, setImportedProductData] = useState<{
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    priceInSats?: number;
    images?: string[];
    url?: string;
    category?: string;
  } | null>(null);

  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { categoryNames } = useCategories();
  // Always fetch all products; filter client-side to avoid re-querying the relay on every category change
  const { data: allProducts, isLoading, refetch } = useMarketplaceProducts();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  // Filter products by category and search query — entirely client-side, no relay requests
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(product => {
      const matchesCategory = selectedCategory === 'All Categories' ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  // Use allProducts for stats (unfiltered)
  const products = allProducts;

  // Calculate stats
  const totalProducts = products?.length || 0;

  // Total stock value: price × quantity (1 for digital/unlimited), grouped by currency
  const stockValueByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    products?.forEach(product => {
      const qty = product.type === 'digital'
        ? 1  // digital = count once (no stock limit)
        : (product.quantity ?? 1);
      const value = product.price * Math.max(qty, 0);
      const cur = product.currency || 'USD';
      totals[cur] = (totals[cur] ?? 0) + value;
    });
    return totals;
  }, [products]);

  const outOfStockProducts = products?.filter(product =>
    product.quantity !== undefined && product.quantity <= 0
  ).length || 0;

  const handleCreateSuccess = () => {
    setActiveTab('products');
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
    setActiveTab('products');
    refetch();
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to manage marketplace products.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your marketplace products and inventory
          </p>
        </div>
        <Button
          onClick={() => setActiveTab('create')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Stock Value</p>
                {Object.keys(stockValueByCurrency).length === 0 ? (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-0.5">
                    {Object.entries(stockValueByCurrency).map(([currency, value]) => (
                      <p key={currency} className="text-xl font-bold leading-tight">
                        {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                        {value.toFixed(2)}
                        {!['USD','EUR','GBP'].includes(currency) && ` ${currency}`}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">price × stock qty</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{new Set(products?.map(p => p.category)).size || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1.5 max-w-full">
          <TabsTrigger value="orders" className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
            <ClipboardList className="h-3.5 w-3.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <BarChart2 className="h-3.5 w-3.5" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="import">Import URL</TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
            <Truck className="h-3.5 w-3.5" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="publish" className="text-purple-600 dark:text-purple-400 font-semibold">Marketplaces</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <OrdersManagement />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <OrderMessaging />
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <StockManagement />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Categories">All Categories</SelectItem>
                      {categoryNames.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <div className="aspect-square">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <CardTitle className="mb-2">No Products Found</CardTitle>
                    <CardDescription>
                      {searchQuery || selectedCategory !== 'All Categories'
                        ? "No products match your current filters. Try adjusting your search or category filter."
                        : "You haven't created any products yet. Start by adding your first product to the marketplace."
                      }
                    </CardDescription>
                  </div>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        {product.type === 'digital' ? (
                          <Download className="w-12 h-12 text-gray-400" />
                        ) : (
                          <Package className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    )}

                    {/* Product Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={product.type === 'digital' ? 'default' : 'secondary'} className="text-xs">
                        {product.type === 'digital' ? (
                          <>
                            <Download className="w-3 h-3 mr-1" />
                            Digital
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 mr-1" />
                            Physical
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Stock Status */}
                    {product.quantity !== undefined && product.quantity <= 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">
                          {product.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          {product.quantity !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {product.quantity} available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="text-sm line-clamp-2 mb-3">
                      {product.description}
                    </CardDescription>

                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(product.price, product.currency)}
                      </div>

                      <div className="flex space-x-2 flex-wrap gap-1">
                         <PublishToMarketplaces product={product} />

                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setEditingProduct(product)}
                         >
                           <Edit className="w-4 h-4" />
                         </Button>

                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="outline" size="sm" disabled={isDeleting}>
                               <Trash2 className="w-4 h-4 text-red-500" />
                             </Button>
                           </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action will publish a deletion event to the Nostr network and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={isDeleting}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <CreateProductForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setActiveTab('products')}
            initialData={importedProductData}
          />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <AddProductByUrl 
            onProductScraped={(data) => {
              setImportedProductData(data);
              setActiveTab('create');
              toast({
                title: "Product Data Imported",
                description: `Loaded "${data.name}". Review and publish to your shop.`,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          {/* Gamma Spec kind 30406 shipping options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Gamma Spec Shipping Options
                <Badge variant="outline" className="text-xs font-mono ml-1">kind 30406</Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                Addressable shipping events that products reference via <code className="text-xs">shipping_option</code> tags.
                These are cross-compatible with Shopstr, Plebeian Market, and Conduit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShippingOptionsAdmin />
            </CardContent>
          </Card>

          {/* Legacy zone-based shipping config */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Legacy Zone Shipping Config</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Used for checkout price calculation. Stored as kind 30078.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShippingConfigAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publish" className="space-y-6">
          <BulkPublishPanel products={filteredProducts} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>



        <TabsContent value="debug">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lightning Address Debugging</CardTitle>
                <CardDescription>
                  Debug the Lightning address integration to identify and fix payment issues.
                  This tool tests the LNURL endpoint and invoice generation process.
                </CardDescription>
              </CardHeader>
            </Card>
            <LightningAddressDebugger />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EditProductForm
              product={editingProduct}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useMemo } from 'react';
import { NOSTR_MARKETPLACES } from '@/hooks/usePublishToMarketplace';
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
} from 'lucide-react';

import { useCategories } from '@/hooks/useCategories';

/** Bulk publish panel shown in the Marketplaces tab */
function BulkPublishPanel({ products }: { products: MarketplaceProduct[] }) {
  return (
    <div className="space-y-6">
      {/* Info card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Store className="h-5 w-5" />
            Publish Merch to Nostr Marketplaces
          </CardTitle>
          <CardDescription className="text-purple-600 dark:text-purple-400">
            Your products are stored as Nostr events. Click <strong>"Publish to Markets"</strong>{' '}
            on any product to broadcast it to the selected Nostr marketplaces. Each marketplace
            reads from public relays — publishing once makes your listing visible everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {NOSTR_MARKETPLACES.map((market) => (
              <a
                key={market.id}
                href={market.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 border border-purple-100 dark:border-purple-900 hover:shadow-md transition-all group"
              >
                <span
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r ${market.color} text-white text-sm flex-shrink-0`}
                >
                  {market.logo}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold truncate">{market.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {market.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 rounded"
                      >
                        {fmt === 'nip99' ? 'NIP-99' : 'NIP-15'}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product list with publish buttons */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          Your Products ({products.length})
        </h3>

        {products.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-muted-foreground">No products found. Create some products first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
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
                      {product.type === 'digital' ? (
                        <Download className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {product.type === 'digital' ? '⬇️ Digital' : '📦 Physical'}
                      </Badge>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {product.price} {product.currency}
                      </span>
                    </div>
                  </div>

                  {/* Publish button */}
                  <div className="flex-shrink-0">
                    <PublishToMarketplaces product={product} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductManagement() {
  const [activeTab, setActiveTab] = useState('products');
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
  const totalValue = products?.reduce((sum, product) => sum + product.price, 0) || 0;
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
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
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
        <TabsList className="grid w-full grid-cols-6 max-w-5xl">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="import">Import URL</TabsTrigger>
          <TabsTrigger value="publish" className="text-purple-600 dark:text-purple-400 font-semibold">Marketplaces</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

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
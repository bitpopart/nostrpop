import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import { useCategories } from '@/hooks/useCategories';
import { useShopTags } from '@/hooks/useShopTags';
import type { MarketplaceProduct } from '@/lib/sampleProducts';
import {
  Package,
  Download,
  Upload,
  X,
  Plus,
  DollarSign,
  Tag,
  FileText,
  Truck,
  Loader2,
  Image as ImageIcon,
  Save,
  Percent,
} from 'lucide-react';

// Categories are now loaded dynamically from useCategories hook

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'BTC', label: 'BTC (₿)' },
  { value: 'SAT', label: 'Satoshis' }
];

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  discount: z.number().min(0, 'Discount cannot be negative').max(99, 'Discount cannot exceed 99%').optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['physical', 'digital']),
  quantity: z.number().min(0).optional(),
  stallId: z.string().min(1, 'Stall ID is required'),
  contactUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  specs: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1)
  })).optional()
});

interface ShippingRegion {
  id: string;
  name: string;
  countries: string;
  cost: number;
}

type ProductFormData = z.infer<typeof productSchema>;

interface EditProductFormProps {
  product: MarketplaceProduct;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Convert old-format shipping (just {id, cost}) to new region format
function normalizeShipping(shipping: MarketplaceProduct['shipping']): ShippingRegion[] {
  if (!shipping || shipping.length === 0) {
    return [{ id: 'region-1', name: '', countries: '', cost: 0 }];
  }
  return shipping.map((s, i) => ({
    id: s.id || `region-${i}`,
    name: (s as ShippingRegion).name || s.id || '',
    countries: (s as ShippingRegion).countries || '',
    cost: s.cost ?? 0,
  }));
}

export function EditProductForm({ product, onSuccess, onCancel }: EditProductFormProps) {
  const [images, setImages] = useState<string[]>(product.images || []);
  const [digitalFiles, setDigitalFiles] = useState<string[]>(product.digital_files || []);
  const [digitalFileNames, setDigitalFileNames] = useState<string[]>(product.digital_file_names || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    product.specs?.map(([key, value]) => ({ key, value })) || []
  );
  const [shippingRegions, setShippingRegions] = useState<ShippingRegion[]>(() => normalizeShipping(product.shipping));
  // keyword_tags exist on the extended MarketplaceProduct from useMarketplaceProducts but not the slim sampleProducts type
  const [keywordTags, setKeywordTags] = useState<string[]>((product as { keyword_tags?: string[] }).keyword_tags || []);
  const [tagInput, setTagInput] = useState('');

  const addShippingRegion = () => {
    setShippingRegions(prev => [...prev, { id: `region-${Date.now()}`, name: '', countries: '', cost: 0 }]);
  };

  const updateShippingRegion = (idx: number, field: keyof ShippingRegion, value: string | number) => {
    setShippingRegions(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeShippingRegion = (idx: number) => {
    setShippingRegions(prev => prev.filter((_, i) => i !== idx));
  };

  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();
  const { categoryNames } = useCategories();
  const { tagNames: presetTags } = useShopTags();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      discount: product.discount || undefined,
      category: product.category,
      type: product.type,
      quantity: product.quantity,
      stallId: product.stall_id,
      contactUrl: product.contact_url || ''
    }
  });

  const productType = watch('type');
  const isPhysical = productType === 'physical';
  const watchedPrice = watch('price');
  const watchedDiscount = watch('discount');
  const watchedCurrency = watch('currency');

  // Calculate discounted price for preview
  const discountedPrice = watchedDiscount && watchedDiscount > 0 && watchedPrice > 0
    ? watchedPrice * (1 - watchedDiscount / 100)
    : null;

  // Set initial form values
  useEffect(() => {
    setValue('name', product.name);
    setValue('description', product.description);
    setValue('price', product.price);
    setValue('currency', product.currency);
    setValue('discount', product.discount || undefined);
    setValue('category', product.category);
    setValue('type', product.type);
    setValue('quantity', product.quantity);
    setValue('stallId', product.stall_id);
    setValue('contactUrl', product.contact_url || '');
    setShippingRegions(normalizeShipping(product.shipping));
    setKeywordTags((product as { keyword_tags?: string[] }).keyword_tags || []);
  }, [product, setValue]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const tags = await uploadFile(file);
        return tags[0][1]; // Get the URL from the first tag
      });

      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...urls]);

      toast({
        title: "Images Uploaded",
        description: `${urls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDigitalFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const tags = await uploadFile(file);
        return {
          url: tags[0][1], // Get the URL from the first tag
          name: file.name
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const urls = uploadedFiles.map(f => f.url);
      const names = uploadedFiles.map(f => f.name);

      setDigitalFiles(prev => [...prev, ...urls]);
      setDigitalFileNames(prev => [...prev, ...names]);

      toast({
        title: "Digital Files Uploaded",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload digital files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeDigitalFile = (index: number) => {
    setDigitalFiles(prev => prev.filter((_, i) => i !== index));
    setDigitalFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    setSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    setSpecs(prev => prev.map((spec, i) =>
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  const removeSpec = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to edit products.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Filter out empty specs
      const validSpecs = specs.filter(spec => spec.key.trim() && spec.value.trim());

      // Build shipping data: filter regions that have a name set
      const validShipping = isPhysical
        ? shippingRegions.filter(r => r.name.trim()).map(r => ({
            id: r.id,
            name: r.name.trim(),
            countries: r.countries.trim(),
            cost: Number(r.cost) || 0,
          }))
        : undefined;

      // ── Build NIP-99 / Gamma Spec kind 30402 tags (UPDATE) ─────────────────
      const now = Math.floor(Date.now() / 1000);

      const tags: string[][] = [
        ['d', product.id], // Keep the same d-tag for addressable updates
        ['title', data.name],
        ['summary', data.description.slice(0, 500)],
        ['published_at', now.toString()],
        // NIP-99 price: ["price", "<amount>", "<ISO-4217>"]
        ['price', data.price.toString(), data.currency.toUpperCase()],
        // Gamma Spec type: ["type", "simple", "digital|physical"]
        ['type', 'simple', data.type],
        // Gamma Spec visibility
        ['visibility', 'on-sale'],
        // Status
        ['status', data.quantity === 0 ? 'sold' : 'active'],
      ];

      // Stock (Gamma Spec)
      if (data.quantity !== undefined) {
        tags.push(['stock', data.quantity.toString()]);
      }

      // Images with sort order
      images.forEach((url, index) => {
        tags.push(['image', url, '', index.toString()]);
      });

      // Specs as individual ["spec", key, value] tags (Gamma Spec)
      validSpecs.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          tags.push(['spec', spec.key.trim(), spec.value.trim()]);
        }
      });

      // Discount (extension)
      if (data.discount && data.discount > 0) {
        tags.push(['discount', data.discount.toString()]);
      }

      // Category and keyword t-tags
      tags.push(['t', data.category.toLowerCase()]);
      keywordTags.forEach(tag => tags.push(['t', tag.toLowerCase()]));
      tags.push(['t', 'bitpopart']);

      // Contact URL
      if (data.contactUrl) {
        tags.push(['r', data.contactUrl]);
      }

      // NIP-31 alt tag
      tags.push(['alt', `${data.type === 'digital' ? 'Digital' : 'Physical'} product: ${data.name} — ${data.price} ${data.currency}`]);

      // Markdown content
      const specsSection = validSpecs.length > 0
        ? `\n\n**Specs:**\n${validSpecs.map(s => `- ${s.key}: ${s.value}`).join('\n')}`
        : '';
      const markdownContent = `## ${data.name}\n\n${data.description}\n\n**Price:** ${data.price} ${data.currency}${data.discount ? ` (-${data.discount}%)` : ''}\n**Category:** ${data.category}\n**Type:** ${data.type === 'digital' ? 'Digital Download' : 'Physical Product'}${specsSection}\n\n*Listed by BitPopArt*`;

      // Publish as NIP-99 kind 30402 (Gamma Spec compliant, addressable update)
      createEvent({
        kind: 30402,
        content: markdownContent,
        tags,
      });

      toast({
        title: "Product Updated",
        description: "Your product has been updated successfully.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Product update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to edit marketplace products.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Save className="w-5 h-5" />
          <span>Edit Product</span>
        </CardTitle>
        <CardDescription>
          Update your marketplace product information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  onValueChange={(value) => setValue('category', value)}
                  defaultValue={product.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryNames.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your product in detail..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Keyword Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-orange-500" />
                Keyword Tags
                <span className="text-xs text-muted-foreground font-normal ml-1">(helps buyers find your product)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. bitcoin, sneek, amsterdam…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
                      if (t && !keywordTags.includes(t)) setKeywordTags(prev => [...prev, t]);
                      setTagInput('');
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
                    if (t && !keywordTags.includes(t)) setKeywordTags(prev => [...prev, t]);
                    setTagInput('');
                  }}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
              {keywordTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {keywordTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                      #{tag}
                      <button type="button" onClick={() => setKeywordTags(prev => prev.filter(t => t !== tag))} className="ml-0.5 hover:text-red-600 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Preset tag quick-add chips */}
              {presetTags.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-muted-foreground font-medium">Quick-add from your tag library:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {presetTags.map(tag => {
                      const already = keywordTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          disabled={already}
                          onClick={() => !already && setKeywordTags(prev => [...prev, tag])}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            already
                              ? 'bg-orange-500 text-white border-orange-500 cursor-default opacity-80'
                              : 'bg-white dark:bg-gray-800 text-muted-foreground border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:text-orange-600'
                          }`}
                        >
                          {already ? '✓ ' : '+ '}#{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Press Enter or comma to add. Buyers can filter the shop by these tags.</p>
            </div>
          </div>

          <Separator />

          {/* Product Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Product Type
            </h3>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={productType === 'digital'}
                  onCheckedChange={(checked) => setValue('type', checked ? 'digital' : 'physical')}
                />
                <Label className="flex items-center space-x-2">
                  {productType === 'digital' ? (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Digital Product</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Physical Product</span>
                    </>
                  )}
                </Label>
              </div>
              <Badge variant={productType === 'digital' ? 'default' : 'secondary'}>
                {productType === 'digital' ? 'Digital' : 'Physical'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  onValueChange={(value) => setValue('currency', value)}
                  defaultValue={product.currency}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Available</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-3 p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
              <div className="flex items-center space-x-2">
                <Percent className="w-4 h-4 text-orange-600" />
                <Label className="font-medium text-orange-700 dark:text-orange-400">Discount (optional)</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Percentage (%)</Label>
                  <div className="relative">
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      {...register('discount', { valueAsNumber: true })}
                      placeholder="e.g. 21"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                  {errors.discount && (
                    <p className="text-sm text-red-500">{errors.discount.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Leave empty or set to 0 to remove discount</p>
                </div>
                {discountedPrice !== null && watchedPrice > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Price Preview</Label>
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="line-through text-muted-foreground text-sm">
                          {watchedCurrency} {watchedPrice.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded">
                          -{watchedDiscount}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {watchedCurrency} {discountedPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isPhysical && (
              <div className="space-y-4">
                {/* Region-based shipping */}
                <div className="space-y-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <Label className="font-medium text-blue-700 dark:text-blue-400">Shipping Regions</Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addShippingRegion}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Region
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set shipping costs per region. Use 0 for free shipping. Leave countries blank to match all.
                  </p>
                  <div className="space-y-2">
                    {shippingRegions.map((region, idx) => (
                      <div key={region.id} className="grid grid-cols-[1fr_1.5fr_auto_auto] gap-2 items-center">
                        <Input
                          placeholder="Region name (e.g. Netherlands)"
                          value={region.name}
                          onChange={(e) => updateShippingRegion(idx, 'name', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Countries (e.g. NL, BE, DE)"
                          value={region.countries}
                          onChange={(e) => updateShippingRegion(idx, 'countries', e.target.value)}
                          className="text-sm"
                        />
                        <div className="relative w-24">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={region.cost === 0 ? '' : region.cost}
                            onChange={(e) => updateShippingRegion(idx, 'cost', parseFloat(e.target.value) || 0)}
                            className="text-sm pr-6"
                          />
                          {region.cost === 0 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600 font-semibold pointer-events-none">Free</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeShippingRegion(idx)}
                          className="text-red-500 hover:text-red-700 px-2"
                          disabled={shippingRegions.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactUrl">External Shop URL</Label>
                  <Input
                    id="contactUrl"
                    {...register('contactUrl')}
                    placeholder="https://storeofvalue.eu/shop/product-..."
                  />
                  {errors.contactUrl && (
                    <p className="text-sm text-red-500">{errors.contactUrl.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    If set, customers are redirected to this external webshop to buy. Cart and Lightning payment are disabled — the product is listed on Nostr marketplaces but sold externally only.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              Product Images
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label htmlFor="images" className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Images</span>
                  </div>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
                {isUploading && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Digital Files - Only show for digital products */}
          {!isPhysical && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Digital Files
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="digitalFiles" className="cursor-pointer">
                      <div className="flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload Digital Files</span>
                      </div>
                      <Input
                        id="digitalFiles"
                        type="file"
                        multiple
                        onChange={handleDigitalFileUpload}
                        className="hidden"
                      />
                    </Label>
                    {isUploadingFiles && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading files...</span>
                      </div>
                    )}
                  </div>

                  {digitalFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {digitalFiles.length} file(s) uploaded. These will be available for download after purchase.
                      </p>
                      <div className="space-y-2">
                        {digitalFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                              <Download className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {digitalFileNames[index] || `File ${index + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-md">
                                  {file}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDigitalFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {digitalFiles.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                      <Download className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No digital files uploaded yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload files that customers will receive after purchase
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Specifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Product Specifications</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                <Plus className="w-4 h-4 mr-1" />
                Add Spec
              </Button>
            </div>

            {specs.map((spec, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Property name"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, 'value', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSpec(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Stall Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stall Configuration</h3>
            <div className="space-y-2">
              <Label htmlFor="stallId">Stall ID *</Label>
              <Input
                id="stallId"
                {...register('stallId')}
                placeholder="Enter your stall identifier"
              />
              {errors.stallId && (
                <p className="text-sm text-red-500">{errors.stallId.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isPublishing}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
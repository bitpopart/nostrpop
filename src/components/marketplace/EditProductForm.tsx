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
  Save
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
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['physical', 'digital']),
  quantity: z.number().min(0).optional(),
  stallId: z.string().min(1, 'Stall ID is required'),
  shippingCost: z.number().min(0).optional(),
  contactUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  specs: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1)
  })).optional()
});

type ProductFormData = z.infer<typeof productSchema>;

interface EditProductFormProps {
  product: MarketplaceProduct;
  onSuccess?: () => void;
  onCancel?: () => void;
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

  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();
  const { categoryNames } = useCategories();

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
      category: product.category,
      type: product.type,
      quantity: product.quantity,
      stallId: product.stall_id,
      shippingCost: product.shipping?.[0]?.cost || 0,
      contactUrl: product.contact_url || ''
    }
  });

  const productType = watch('type');
  const isPhysical = productType === 'physical';

  // Set initial form values
  useEffect(() => {
    setValue('name', product.name);
    setValue('description', product.description);
    setValue('price', product.price);
    setValue('currency', product.currency);
    setValue('category', product.category);
    setValue('type', product.type);
    setValue('quantity', product.quantity);
    setValue('stallId', product.stall_id);
    setValue('shippingCost', product.shipping?.[0]?.cost || 0);
    setValue('contactUrl', product.contact_url || '');
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

      // Create updated product content
      const productContent = {
        name: data.name,
        description: data.description,
        images: images,
        price: data.price,
        currency: data.currency,
        quantity: data.quantity,
        specs: validSpecs.length > 0 ? validSpecs.map(spec => [spec.key, spec.value]) : undefined,
        shipping: isPhysical && data.shippingCost ? [{ id: 'standard', cost: data.shippingCost }] : undefined,
        contact_url: data.contactUrl || undefined,
        stall_id: data.stallId,
        digital_files: digitalFiles.length > 0 ? digitalFiles : undefined,
        digital_file_names: digitalFileNames.length > 0 ? digitalFileNames : undefined
      };

      // Create tags (use existing product ID for updates)
      const tags = [
        ['d', product.id], // Keep the same identifier for updates
        ['title', data.name],
        ['t', data.category.toLowerCase()],
        ['t', data.type],
        ['price', data.price.toString()],
        ['currency', data.currency]
      ];

      // Add quantity tag if specified
      if (data.quantity !== undefined) {
        tags.push(['quantity', data.quantity.toString()]);
      }

      // Publish as updated NIP-15 product event (kind 30018)
      createEvent({
        kind: 30018,
        content: JSON.stringify(productContent),
        tags
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

            {isPhysical && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCost" className="flex items-center">
                    <Truck className="w-4 h-4 mr-1" />
                    Shipping Cost
                  </Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    {...register('shippingCost', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactUrl">Contact Seller URL</Label>
                  <Input
                    id="contactUrl"
                    {...register('contactUrl')}
                    placeholder="https://example.com/contact"
                  />
                  {errors.contactUrl && (
                    <p className="text-sm text-red-500">{errors.contactUrl.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    URL where customers can contact you (opens in new window when they click "Contact Seller")
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
import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import type { BadgeData } from '@/lib/badgeTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Upload, Award, Edit, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { generateBadgeUUID } from '@/lib/badgeTypes';
import { toast } from 'sonner';
import type { BadgeData } from '@/lib/badgeTypes';
import type { NostrEvent } from '@nostrify/nostrify';

interface NIP58Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  thumb?: string;
  event: NostrEvent;
}

export function BadgeManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  
  // Fetch ALL badges for admin (including inactive/archived)
  const { data: allBadges, isLoading } = useQuery({
    queryKey: ['badges-admin', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38173], authors: [user.pubkey], limit: 100 }],
        { signal }
      );

      const badges: BadgeData[] = events
        .map((event): BadgeData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const status = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'sold_out' | 'archived' || 'active';
            const price = event.tags.find(t => t[0] === 'price')?.[1];
            const imageUrl = event.tags.find(t => t[0] === 'image')?.[1];
            const featured = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';
            
            if (!id || !title || !imageUrl) return null;

            return {
              id,
              event,
              title,
              description: content.description,
              image_url: imageUrl,
              price_sats: price ? parseInt(price) : 0,
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              status,
              featured,
            };
          } catch {
            return null;
          }
        })
        .filter((b): b is BadgeData => b !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return badges;
    },
    enabled: !!user?.pubkey,
  });
  
  const badges = allBadges || [];
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [selectedBadgesToImport, setSelectedBadgesToImport] = useState<Set<string>>(new Set());
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [priceSats, setPriceSats] = useState('');
  const [status, setStatus] = useState<'active' | 'sold_out' | 'archived'>('active');
  const [featured, setFeatured] = useState(false);

  // Fetch NIP-58 badges from user's account (kind 30009)
  const { data: nip58Badges = [], isLoading: isLoadingNIP58, refetch: refetchNIP58 } = useQuery({
    queryKey: ['nip58-badges', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      console.log('[BadgeManagement] Fetching NIP-58 badges from pubkey:', user.pubkey);
      
      const events = await nostr.query(
        [{ kinds: [30009], authors: [user.pubkey], limit: 100 }],
        { signal }
      );

      console.log('[BadgeManagement] Found NIP-58 events:', events.length);

      const parsedBadges: NIP58Badge[] = events
        .map((event): NIP58Badge | null => {
          try {
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const name = event.tags.find(t => t[0] === 'name')?.[1];
            const description = event.tags.find(t => t[0] === 'description')?.[1] || event.content;
            const image = event.tags.find(t => t[0] === 'image')?.[1];
            const thumb = event.tags.find(t => t[0] === 'thumb')?.[1];

            console.log('[BadgeManagement] Parsing badge:', { id, name, hasImage: !!image });

            if (!id || !name || !image) return null;

            return {
              id,
              name,
              description,
              image,
              thumb,
              event,
            };
          } catch (e) {
            console.error('[BadgeManagement] Failed to parse badge:', e);
            return null;
          }
        })
        .filter((b): b is NIP58Badge => b !== null);

      console.log('[BadgeManagement] Parsed badges:', parsedBadges.length);
      return parsedBadges;
    },
    enabled: !!user?.pubkey && showImport,
    staleTime: 0, // Always fetch fresh data
  });
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setPriceSats('');
    setStatus('active');
    setFeatured(false);
    setEditingBadge(null);
    setIsCreating(false);
  };

  const handleEdit = (badge: BadgeData) => {
    setEditingBadge(badge);
    setTitle(badge.title);
    setDescription(badge.description || '');
    setImageUrl(badge.image_url);
    setPriceSats(badge.price_sats.toString());
    setStatus(badge.status);
    setFeatured(badge.featured || false);
    setIsCreating(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tags = await uploadFile(file);
      const url = tags[0][1]; // First tag contains the URL
      setImageUrl(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleSubmit = () => {
    if (!user || !title.trim() || !imageUrl || !priceSats) return;

    const badgeId = editingBadge?.id || generateBadgeUUID();

    createEvent({
      kind: 38173,
      content: JSON.stringify({
        description: description.trim() || undefined,
      }),
      tags: [
        ['d', badgeId],
        ['title', title.trim()],
        ['image', imageUrl],
        ['price', priceSats],
        ['status', status],
        ['t', 'pop-badge'],
        ...(featured ? [['featured', 'true']] : []),
      ],
    });

    resetForm();
  };

  // Toggle badge selection for import
  const toggleBadgeSelection = (badgeId: string) => {
    const newSelection = new Set(selectedBadgesToImport);
    if (newSelection.has(badgeId)) {
      newSelection.delete(badgeId);
    } else {
      newSelection.add(badgeId);
    }
    setSelectedBadgesToImport(newSelection);
  };

  // Import selected NIP-58 badges
  const handleImportBadges = () => {
    if (!user || selectedBadgesToImport.size === 0) return;

    const badgesToImport = nip58Badges.filter(b => selectedBadgesToImport.has(b.id));
    
    badgesToImport.forEach((nip58Badge) => {
      // Convert NIP-58 badge to custom kind 38173
      createEvent({
        kind: 38173,
        content: JSON.stringify({
          description: nip58Badge.description,
          nip58_source: true, // Mark as imported from NIP-58
        }),
        tags: [
          ['d', nip58Badge.id], // Keep original badge ID
          ['title', nip58Badge.name],
          ['image', nip58Badge.image],
          ['price', '21000'], // Default price - can be edited later
          ['status', 'active'],
          ['t', 'pop-badge'],
        ],
      });
    });

    toast.success(`Importing ${selectedBadgesToImport.size} badge(s)...`);
    setSelectedBadgesToImport(new Set());
    setShowImport(false);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to manage POP badges</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>POP Badge Management</CardTitle>
              <CardDescription>Create badges that people can purchase - inspired by badges.page</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowImport(!showImport)} variant={showImport ? "outline" : "secondary"}>
                {showImport ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Import
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import from badges.page
                  </>
                )}
              </Button>
              <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
                {isCreating ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Badge
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Import Section */}
      {showImport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Import Badges from badges.page
            </CardTitle>
            <CardDescription>
              Select your NIP-58 badges to import and make them available for purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNIP58 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : nip58Badges.length === 0 ? (
              <Alert>
                <Award className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">No badges found on your account.</p>
                  <p className="text-sm text-muted-foreground">
                    Create badges on <a href="https://badges.page" target="_blank" rel="noopener noreferrer" className="underline">badges.page</a> first, then come back here to import them.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {nip58Badges.map((nip58Badge) => {
                    const isSelected = selectedBadgesToImport.has(nip58Badge.id);
                    const alreadyImported = badges?.some(b => b.id === nip58Badge.id);

                    return (
                      <div
                        key={nip58Badge.id}
                        className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                            : alreadyImported
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                        onClick={() => !alreadyImported && toggleBadgeSelection(nip58Badge.id)}
                      >
                        {alreadyImported && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Imported
                            </Badge>
                          </div>
                        )}
                        {isSelected && !alreadyImported && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-purple-600">
                              <CheckCircle2 className="h-3 w-3" />
                            </Badge>
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div className="aspect-square relative overflow-hidden rounded-lg">
                            <img
                              src={nip58Badge.thumb || nip58Badge.image}
                              alt={nip58Badge.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-semibold text-sm truncate">{nip58Badge.name}</h3>
                          {nip58Badge.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {nip58Badge.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedBadgesToImport.size > 0 && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium">
                      {selectedBadgesToImport.size} badge(s) selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBadgesToImport(new Set())}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleImportBadges}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Import Selected
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showImport && <Separator />}

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBadge ? 'Edit' : 'Create New'} Badge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Badge Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Early Supporter, VIP Member"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this badge represents"
                rows={3}
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Badge Image *</Label>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Badge"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-purple-200"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2"
                    onClick={() => setImageUrl('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <div className="text-center">
                    {isUploading ? (
                      <div className="animate-spin text-2xl">⏳</div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-500">Upload</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
              <p className="text-sm text-muted-foreground">
                Upload the badge image (recommended: square, 512x512px)
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price in Sats *</Label>
              <Input
                id="price"
                type="number"
                value={priceSats}
                onChange={(e) => setPriceSats(e.target.value)}
                placeholder="21000"
                min="0"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'sold_out' | 'archived')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked as boolean)}
              />
              <Label htmlFor="featured" className="text-sm font-medium">
                Feature on homepage and projects page
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !imageUrl || !priceSats}
              >
                {editingBadge ? 'Update' : 'Create'} Badge
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing POP Badges</CardTitle>
          <CardDescription>All available badges for purchase</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-32 w-full rounded" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : badges && badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="group relative rounded-lg border hover:shadow-lg transition-all p-4 space-y-2"
                >
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    <img
                      src={badge.image_url}
                      alt={badge.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm truncate">{badge.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {badge.price_sats.toLocaleString()} sats
                      </Badge>
                      <Badge variant={badge.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {badge.status}
                      </Badge>
                      {badge.featured && (
                        <Badge variant="outline" className="text-xs">
                          <Award className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleEdit(badge)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No badges yet. Create your first POP badge!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

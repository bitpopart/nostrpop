import { useState, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Target,
  Plus,
  Loader2,
  Trash2,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  Calendar,
  Zap,
  ExternalLink,
  Globe,
} from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { generateFundraiserUUID, formatSats, isExternalFundraiser, type FundraiserTier, type FundingMode } from '@/lib/fundraiserTypes';

interface FundraiserFormData {
  title: string;
  description: string;
  thumbnail: string;
  goal_sats: string;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  funding_mode: FundingMode;
  external_url: string;
  project_url: string;
  tiers: FundraiserTier[];
}
interface FundraiserContent {
  title?: string;
  description?: string;
  thumbnail?: string;
  goal_sats?: number;
  deadline?: string;
  status?: 'active' | 'completed' | 'cancelled';
  funding_mode?: string;
  external_url?: string;
  project_url?: string;
  tiers?: FundraiserTier[];
}

/** Parse a fundraiser event's content JSON safely. Malformed or empty
 *  content (e.g. kind-38178 project-design events sharing the same kind)
 *  must never crash the tab or break edits — treat bad content as {}. */
function parseFundraiserContent(content: string): FundraiserContent {
  if (!content) return {};
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? (parsed as FundraiserContent) : {};
  } catch {
    return {};
  }
}

export function FundraiserManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState<NostrEvent | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<FundraiserFormData>({
    title: '',
    description: '',
    thumbnail: '',
    goal_sats: '',
    deadline: '',
    status: 'active',
    funding_mode: 'internal',
    external_url: '',
    project_url: '',
    tiers: [],
  });

  // Fetch user's fundraisers (kind 38178)
  const { data: fundraisers = [], isLoading } = useQuery({
    queryKey: ['fundraisers-admin', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [38178], '#t': ['fundraiser'], authors: [user.pubkey], limit: 100 }],
        { signal }
      );
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user?.pubkey,
  });

  const handleInputChange = (field: keyof FundraiserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File is larger than 10MB. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      const imageUrl = tags[0][1];
      setFormData(prev => ({ ...prev, thumbnail: imageUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTier = () => {
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { id: generateFundraiserUUID(), name: '', description: '', product_url: '' }],
    }));
  };

  const removeTier = (id: string) => {
    setFormData(prev => ({ ...prev, tiers: prev.tiers.filter(t => t.id !== id) }));
  };

  const updateTierField = (id: string, field: 'name' | 'description' | 'price_eur' | 'product_url', value: string) => {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.map(t => {
        if (t.id !== id) return t;
        if (field === 'price_eur') {
          const n = parseFloat(value);
          return { ...t, price_eur: value.trim() === '' || Number.isNaN(n) ? undefined : n };
        }
        return { ...t, [field]: value };
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isExternal = formData.funding_mode === 'external';
    const goal = parseInt(formData.goal_sats);

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a fundraiser title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (isExternal) {
      if (!formData.external_url.trim()) {
        toast.error('Please enter the URL of your external fundraising page');
        return;
      }
    } else if (!formData.goal_sats || goal <= 0) {
      toast.error('Please enter a valid fundraising goal');
      return;
    }

    const fundraiserId = editingFundraiser?.tags.find(t => t[0] === 'd')?.[1] || generateFundraiserUUID();

    const tags: string[][] = [
      ['d', fundraiserId],
      ['title', formData.title],
      ['status', formData.status],
      ['t', 'fundraiser'],
      ['funding_mode', formData.funding_mode],
    ];

    // Only campaigns that collect here carry an internal sats goal.
    if (!isExternal && goal > 0) {
      tags.push(['goal', String(goal)]);
    }
    if (formData.thumbnail) {
      tags.push(['image', formData.thumbnail]);
    }
    if (formData.deadline) {
      tags.push(['deadline', formData.deadline]);
    }
    if (formData.external_url.trim()) {
      tags.push(['external_url', formData.external_url.trim()]);
    }
    if (formData.project_url.trim()) {
      tags.push(['project_url', formData.project_url.trim()]);
    }

    const contentData = {
      title: formData.title,
      description: formData.description,
      thumbnail: formData.thumbnail,
      goal_sats: isExternal ? 0 : goal,
      deadline: formData.deadline,
      status: formData.status,
      funding_mode: formData.funding_mode,
      external_url: formData.external_url.trim() || undefined,
      project_url: formData.project_url.trim() || undefined,
      tiers: isExternal
        ? []
        : formData.tiers
          .filter(t => t.name.trim())
          .map(t => ({
            id: t.id,
            name: t.name.trim(),
            description: (t.description || '').trim() || undefined,
            price_eur: t.price_eur,
            product_url: (t.product_url || '').trim() || undefined,
          })),
    };

    createEvent(
      {
        kind: 38178,
        content: JSON.stringify(contentData),
        tags,
      },
      {
        onSuccess: () => {
          toast.success(editingFundraiser ? 'Fundraiser updated!' : 'Fundraiser created!');
          setIsCreating(false);
          setEditingFundraiser(null);
          setFormData({
            title: '',
            description: '',
            thumbnail: '',
            goal_sats: '',
            deadline: '',
            status: 'active',
            funding_mode: 'internal',
            external_url: '',
            project_url: '',
            tiers: [],
          });
          queryClient.invalidateQueries({ queryKey: ['fundraisers'] });
          queryClient.invalidateQueries({ queryKey: ['fundraisers-admin'] });
        },
        onError: (error) => {
          console.error('Publish error:', error);
          toast.error('Failed to save fundraiser');
        },
      }
    );
  };

  const handleEdit = (event: NostrEvent) => {
    const content = parseFundraiserContent(event.content);
    const titleTag = event.tags.find(t => t[0] === 'title')?.[1];
    const imageTag = event.tags.find(t => t[0] === 'image')?.[1];
    const goalTag = event.tags.find(t => t[0] === 'goal')?.[1];
    const deadlineTag = event.tags.find(t => t[0] === 'deadline')?.[1];
    const statusTag = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'completed' | 'cancelled' || 'active';
    const externalUrlTag = event.tags.find(t => t[0] === 'external_url')?.[1];
    const projectUrlTag = event.tags.find(t => t[0] === 'project_url')?.[1];
    const fundingModeTag = event.tags.find(t => t[0] === 'funding_mode')?.[1] || content.funding_mode;
    const goal = goalTag ? parseInt(goalTag) : content.goal_sats || 0;
    // Restore the funding mode; campaigns saved before the mode existed are
    // treated as external when they only link out to an external page.
    const fundingMode: FundingMode =
      fundingModeTag === 'external' || (fundingModeTag !== 'internal' && Boolean(externalUrlTag || content.external_url) && !(goal > 0))
        ? 'external'
        : 'internal';

    // Safely restore tiers saved on earlier edits (malformed entries are dropped)
    const rawTiers = Array.isArray(content.tiers) ? content.tiers : [];
    const tiers: FundraiserTier[] = rawTiers
      .filter((t): t is FundraiserTier => !!t && typeof t === 'object' && typeof (t as FundraiserTier).name === 'string')
      .map(t => ({
        id: t.id || generateFundraiserUUID(),
        name: t.name,
        description: typeof t.description === 'string' ? t.description : undefined,
        price_eur: typeof t.price_eur === 'number' && !Number.isNaN(t.price_eur) ? t.price_eur : undefined,
        product_url: typeof t.product_url === 'string' ? t.product_url : undefined,
      }));

    setFormData({
      title: titleTag || content.title || '',
      description: content.description || '',
      thumbnail: imageTag || content.thumbnail || '',
      goal_sats: goalTag || content.goal_sats?.toString() || '',
      deadline: deadlineTag || content.deadline || '',
      status: statusTag,
      funding_mode: fundingMode,
      external_url: externalUrlTag || content.external_url || '',
      project_url: projectUrlTag || content.project_url || '',
      tiers,
    });
    setEditingFundraiser(event);
    setIsCreating(true);
  };

  const handleDelete = (event: NostrEvent) => {
    const fundraiserId = event.tags.find(t => t[0] === 'd')?.[1];
    if (!fundraiserId) return;

    if (confirm('Are you sure you want to delete this fundraiser?')) {
      createEvent(
        {
          kind: 5,
          content: 'Deleted fundraiser',
          tags: [['a', `38178:${event.pubkey}:${fundraiserId}`]],
        },
        {
          onSuccess: () => {
            toast.success('Fundraiser deleted');
            queryClient.invalidateQueries({ queryKey: ['fundraisers'] });
            queryClient.invalidateQueries({ queryKey: ['fundraisers-admin'] });
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingFundraiser(null);
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      goal_sats: '',
      deadline: '',
      status: 'active',
      funding_mode: 'internal',
      external_url: '',
      project_url: '',
      tiers: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                {editingFundraiser ? 'Edit Fundraiser' : 'Create New Fundraiser'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Create a crowdfunding campaign for your art project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="My Amazing Art Project"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project and what you're raising funds for..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  required
                />
              </div>

              {/* Where donations are collected */}
              <div className="space-y-3">
                <Label>Where donations are collected</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('funding_mode', 'internal')}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      formData.funding_mode === 'internal'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Here on BitPopArt
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set a goal in sats, show progress, and collect Lightning contributions on the campaign card.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('funding_mode', 'external')}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      formData.funding_mode === 'external'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      External fundraising page
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your fundraiser runs on an external site — the card links there (opens in a new tab).
                    </p>
                  </button>
                </div>
              </div>

              {formData.funding_mode === 'internal' ? (
                <div className="space-y-2">
                  <Label htmlFor="goal_sats">Fundraising Goal (in sats) *</Label>
                  <Input
                    id="goal_sats"
                    type="number"
                    placeholder="1000000"
                    value={formData.goal_sats}
                    onChange={(e) => handleInputChange('goal_sats', e.target.value)}
                    required
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.goal_sats && parseInt(formData.goal_sats) > 0 
                      ? `Goal: ${formatSats(parseInt(formData.goal_sats))} sats`
                      : 'Enter amount in satoshis (1 BTC = 100,000,000 sats)'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-muted-foreground">
                  This campaign runs on an external fundraising page. The button on the campaign card opens
                  that page in a new tab, so no goal or progress bar is shown here.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Project Image</Label>
                
                {formData.thumbnail ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <img
                        src={formData.thumbnail}
                        alt="Fundraiser thumbnail"
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      type="url"
                      placeholder="Or paste image URL"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <Input
                      type="url"
                      placeholder="Or paste image URL"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_url">
                  External fundraising page URL{formData.funding_mode === 'external' ? ' *' : ' (optional)'}
                </Label>
                <Input
                  id="external_url"
                  type="url"
                  placeholder="https://geyser.fund/... or your external fundraising page"
                  value={formData.external_url}
                  onChange={(e) => handleInputChange('external_url', e.target.value)}
                  required={formData.funding_mode === 'external'}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.funding_mode === 'external'
                    ? 'The main button on the campaign card opens this page in a new tab.'
                    : 'Shows a "Fundraising site" button on the card that opens this page in a new tab (optional).'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_url">Project page on bitpopart.com (optional)</Label>
                <Input
                  id="project_url"
                  type="text"
                  placeholder="e.g. /bitbot/crowdfunding or another bitpopart.com page"
                  value={formData.project_url}
                  onChange={(e) => handleInputChange('project_url', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Button on the card: "More about the project", opens inside the site itself. Use a full page path
                  (e.g. /projects/my-project) or a full https://bitpopart.com/... URL.
                </p>
              </div>

              {formData.funding_mode === 'internal' ? (
                <div className="space-y-3">
                  <div>
                    <Label>Tiers (optional)</Label>
                    <p className="text-xs text-muted-foreground -mt-1">
                      Supporter options shown on the campaign card — e.g. "Just support" (any amount) or
                      "Buy a BitBot — €210, pay in sats". Priced tiers are converted to sats live on the card.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {formData.tiers.map((tier, index) => (
                      <div key={tier.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tier {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => removeTier(tier.id)}
                            aria-label={`Remove tier ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <Input
                          type="text"
                          placeholder="Tier name * — e.g. Just support"
                          value={tier.name}
                          onChange={(e) => updateTierField(tier.id, 'name', e.target.value)}
                        />
                        <Input
                          type="text"
                          placeholder="Description (optional)"
                          value={tier.description || ''}
                          onChange={(e) => updateTierField(tier.id, 'description', e.target.value)}
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Price in EUR (optional) — e.g. 210"
                            value={tier.price_eur !== undefined ? String(tier.price_eur) : ''}
                            onChange={(e) => updateTierField(tier.id, 'price_eur', e.target.value)}
                          />
                          <Input
                            type="text"
                            placeholder="Product link (optional) — e.g. /bitbot"
                            value={tier.product_url || ''}
                            onChange={(e) => updateTierField(tier.id, 'product_url', e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave the price empty for a free-form "send some sats" tier. A priced tier is paid in
                          sats — the card converts the EUR price to sats with the live rate and pre-fills it.
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addTier}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tier
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-muted-foreground">
                  Reward tiers apply to on-site fundraising only. On an external fundraising page, support
                  options are managed on that site.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'completed' | 'cancelled') => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingFundraiser ? 'Update Fundraiser' : 'Create Fundraiser'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-6">
          <Button onClick={() => setIsCreating(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add New Fundraiser
          </Button>
        </div>
      )}

      <Separator />

      {/* Fundraiser List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Your Fundraisers
          </CardTitle>
          <CardDescription>
            Manage your crowdfunding campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fundraisers.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fundraisers yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fundraisers.map((event) => {
                const content = parseFundraiserContent(event.content);
                const title = event.tags.find(t => t[0] === 'title')?.[1] || content.title || 'Untitled';
                const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail;
                const goalTag = event.tags.find(t => t[0] === 'goal')?.[1];
                const goal = goalTag ? parseInt(goalTag) : content.goal_sats || 0;
                const deadline = event.tags.find(t => t[0] === 'deadline')?.[1] || content.deadline;
                const statusTag = event.tags.find(t => t[0] === 'status')?.[1] || content.status || 'active';
                const externalUrl = event.tags.find(t => t[0] === 'external_url')?.[1] || content.external_url || '';
                const fundingMode = event.tags.find(t => t[0] === 'funding_mode')?.[1] || content.funding_mode;
                const externalCampaign = isExternalFundraiser({
                  funding_mode: fundingMode,
                  external_url: externalUrl || undefined,
                  goal_sats: goal,
                });

                return (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="flex gap-4">
                      {thumbnail ? (
                        <div className="w-32 h-24 flex-shrink-0">
                          <img
                            src={thumbnail}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-purple-200 via-pink-200 to-indigo-200 dark:from-purple-800 dark:via-pink-800 dark:to-indigo-800 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-50" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{title}</h3>
                              <Badge variant={statusTag === 'active' ? 'default' : statusTag === 'completed' ? 'secondary' : 'destructive'} className="text-xs">
                                {statusTag}
                              </Badge>
                              {externalCampaign && (
                                <Badge variant="outline" className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  External page
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {content.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {externalCampaign ? (
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  {externalUrl || 'External fundraising page'}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  Goal: {formatSats(goal)} sats
                                </span>
                              )}
                              {deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(event)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

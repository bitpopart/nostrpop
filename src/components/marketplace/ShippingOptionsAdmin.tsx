/**
 * ShippingOptionsAdmin — Manage kind 30406 Gamma Spec shipping options
 *
 * Admin UI for creating, editing, and deleting Nostr-native shipping options
 * following the Gamma Spec (https://github.com/GammaMarkets/market-spec).
 *
 * Each shipping option is an addressable kind 30406 event that products
 * can reference via ["shipping_option", "30406:<pubkey>:<d>"].
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useShippingOptions,
  useCreateShippingOption,
  useDeleteShippingOption,
} from '@/hooks/useShippingOptions';
import type { ShippingOption, ShippingServiceType } from '@/hooks/useShippingOptions';
import {
  Truck,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Globe,
  Package,
  X,
  Edit3,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const SERVICE_LABELS: Record<ShippingServiceType, string> = {
  standard: 'Standard Shipping',
  express: 'Express Shipping',
  overnight: 'Overnight',
  pickup: 'Local Pickup',
};

const SERVICE_COLORS: Record<ShippingServiceType, string> = {
  standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  express: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  overnight: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  pickup: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

// ── Shipping Option Form ────────────────────────────────────────────────────────

interface ShippingOptionFormProps {
  initial?: Partial<ShippingOption>;
  onSave: (option: Omit<ShippingOption, 'event' | 'address'>) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

function ShippingOptionForm({ initial, onSave, onCancel, isSaving }: ShippingOptionFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [price, setPrice] = useState(initial?.price?.toString() || '0');
  const [currency, setCurrency] = useState(initial?.currency || 'USD');
  const [service, setService] = useState<ShippingServiceType>(initial?.service || 'standard');
  const [countriesInput, setCountriesInput] = useState(initial?.countries?.join(', ') || '');
  const [carrier, setCarrier] = useState(initial?.carrier || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [durMin, setDurMin] = useState(initial?.duration?.min || '');
  const [durMax, setDurMax] = useState(initial?.duration?.max || '');
  const [durUnit, setDurUnit] = useState<'H' | 'D' | 'W'>(initial?.duration?.unit || 'D');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !service) return;

    const countries = countriesInput
      .split(/[,\s]+/)
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length === 2);

    onSave({
      id: initial?.id || `shipping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      price: Number(price) || 0,
      currency,
      service,
      countries,
      carrier: carrier.trim() || undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      duration: durMin && durMax ? { min: durMin, max: durMax, unit: durUnit } : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title & Service */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="so-title">Title *</Label>
          <Input
            id="so-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Standard Shipping NL"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Service Type *</Label>
          <Select value={service} onValueChange={v => setService(v as ShippingServiceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SERVICE_LABELS) as ShippingServiceType[]).map(s => (
                <SelectItem key={s} value={s}>{SERVICE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="so-price">Base Price *</Label>
          <Input
            id="so-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['USD', 'EUR', 'GBP', 'SAT'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Countries */}
      <div className="space-y-1.5">
        <Label htmlFor="so-countries">
          Country Codes <span className="text-muted-foreground text-xs">(ISO 3166-1 alpha-2, comma-separated)</span>
        </Label>
        <Input
          id="so-countries"
          value={countriesInput}
          onChange={e => setCountriesInput(e.target.value)}
          placeholder="NL, BE, DE, FR — leave empty for worldwide"
        />
        <p className="text-xs text-muted-foreground">Empty = available worldwide</p>
      </div>

      {/* Carrier & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="so-carrier">Carrier (optional)</Label>
          <Input
            id="so-carrier"
            value={carrier}
            onChange={e => setCarrier(e.target.value)}
            placeholder="PostNL, DHL, FedEx…"
          />
        </div>
        {service === 'pickup' && (
          <div className="space-y-1.5">
            <Label htmlFor="so-location">Pickup Location</Label>
            <Input
              id="so-location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="123 Main St, Amsterdam"
            />
          </div>
        )}
      </div>

      {/* Delivery window */}
      <div className="space-y-1.5">
        <Label>Delivery Window (optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min"
            value={durMin}
            onChange={e => setDurMin(e.target.value)}
            className="w-24"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="number"
            min="0"
            placeholder="Max"
            value={durMax}
            onChange={e => setDurMax(e.target.value)}
            className="w-24"
          />
          <Select value={durUnit} onValueChange={v => setDurUnit(v as 'H' | 'D' | 'W')}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="H">Hours</SelectItem>
              <SelectItem value="D">Days</SelectItem>
              <SelectItem value="W">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="so-desc">Description (optional)</Label>
        <Textarea
          id="so-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Human-readable shipping notes…"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !title.trim()}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving…</>
          ) : (
            <><Plus className="h-4 w-4 mr-1.5" />Save Option</>
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Shipping Option Card ────────────────────────────────────────────────────────

interface ShippingOptionCardProps {
  option: ShippingOption;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

function ShippingOptionCard({ option, onEdit, onDelete, isDeleting }: ShippingOptionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Service icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
          {option.service === 'pickup' ? (
            <MapPin className="h-4 w-4 text-green-600" />
          ) : option.service === 'express' ? (
            <Truck className="h-4 w-4 text-orange-600" />
          ) : (
            <Package className="h-4 w-4 text-blue-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{option.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SERVICE_COLORS[option.service]}`}>
              {SERVICE_LABELS[option.service]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {option.price === 0 ? 'Free' : `${option.currency} ${option.price.toFixed(2)}`}
            </span>
            {option.carrier && <span>· {option.carrier}</span>}
            {option.duration && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {option.duration.min}–{option.duration.max} {option.duration.unit === 'H' ? 'hrs' : option.duration.unit === 'D' ? 'days' : 'wks'}
              </span>
            )}
            {option.countries.length > 0 ? (
              <span className="flex items-center gap-0.5">
                <Globe className="h-3 w-3" />
                {option.countries.slice(0, 3).join(', ')}{option.countries.length > 3 ? ` +${option.countries.length - 3}` : ''}
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                <Globe className="h-3 w-3" />
                Worldwide
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="px-2"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} className="px-2">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground font-medium w-24 flex-shrink-0">Address ref:</span>
            <code className="text-xs bg-background px-2 py-1 rounded border break-all">{option.address}</code>
          </div>
          {option.location && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground font-medium w-24 flex-shrink-0">Location:</span>
              <span>{option.location}</span>
            </div>
          )}
          {option.description && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground font-medium w-24 flex-shrink-0">Notes:</span>
              <span>{option.description}</span>
            </div>
          )}
          {option.countries.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground font-medium w-24 flex-shrink-0">Countries:</span>
              <div className="flex flex-wrap gap-1">
                {option.countries.map(c => (
                  <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

export function ShippingOptionsAdmin() {
  const { data: options = [], isLoading } = useShippingOptions();
  const { mutate: saveOption, isPending: isSaving } = useCreateShippingOption();
  const { mutate: deleteOption, isPending: isDeleting, variables: deletingId } = useDeleteShippingOption();
  const [showForm, setShowForm] = useState(false);
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);

  const handleSave = (option: Omit<ShippingOption, 'event' | 'address'>) => {
    saveOption(option, {
      onSuccess: () => {
        setShowForm(false);
        setEditingOption(null);
      },
    });
  };

  const handleEdit = (option: ShippingOption) => {
    setEditingOption(option);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingOption(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            Shipping Options
            <Badge variant="outline" className="text-xs font-mono">kind 30406</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gamma Spec addressable shipping methods. Products reference these via shipping_option tags.
          </p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Option
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {editingOption ? `Edit: ${editingOption.title}` : 'New Shipping Option'}
            </CardTitle>
            <CardDescription className="text-xs">
              Publishes a kind 30406 event following the Gamma Marketplace Spec.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShippingOptionForm
              initial={editingOption || undefined}
              onSave={handleSave}
              onCancel={handleCancelForm}
              isSaving={isSaving}
            />
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Options list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : options.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-xl">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No Shipping Options Yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create Gamma Spec kind 30406 shipping events that products can reference.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map(option => (
            <ShippingOptionCard
              key={option.id}
              option={option}
              onEdit={() => handleEdit(option)}
              onDelete={() => deleteOption(option.id)}
              isDeleting={isDeleting && deletingId === option.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

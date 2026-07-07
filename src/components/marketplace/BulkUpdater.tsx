import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { NostrEvent } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Save, RotateCcw, Loader2, CheckCircle2, ExternalLink, Package, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

// ── helpers ────────────────────────────────────────────────────────────────

function getTag(tags: string[][], name: string): string | undefined {
  return tags.find(([n]) => n === name)?.[1];
}

function getTags(tags: string[][], name: string): string[] {
  return tags.filter(([n]) => n === name).map(([, v]) => v).filter((v): v is string => v !== undefined);
}

type Visibility = 'on-sale' | 'hidden' | 'pre-order';

interface RowData {
  title: string;
  priceAmount: string;
  priceCurrency: string;
  stock: string;
  status: Visibility;
  categories: string;
  location: string;
  summary: string;
}

interface Row {
  id: string;
  original: NostrEvent;
  sourceTags: string[][];
  thumbnail: string;
  base: RowData;
  data: RowData;
}

function parseRow(event: NostrEvent): Row {
  const priceTag = event.tags.find(([n]) => n === 'price');
  const rawVisibility = getTag(event.tags, 'visibility');
  const status: Visibility =
    rawVisibility === 'hidden' || rawVisibility === 'pre-order' || rawVisibility === 'on-sale'
      ? rawVisibility
      : getTag(event.tags, 'status') === 'sold'
      ? 'hidden'
      : 'on-sale';

  const thumbnail =
    getTag(event.tags, 'image') ??
    getTag(event.tags, 'thumb') ??
    getTag(event.tags, 'url') ??
    '';

  const data: RowData = {
    title: getTag(event.tags, 'title') ?? '',
    priceAmount: priceTag?.[1] ?? '',
    priceCurrency: priceTag?.[2] ?? '',
    stock: getTag(event.tags, 'stock') ?? getTag(event.tags, 'quantity') ?? '',
    status,
    categories: getTags(event.tags, 't').join(', '),
    location: getTag(event.tags, 'location') ?? '',
    summary: getTag(event.tags, 'summary') ?? '',
  };

  return {
    id: getTag(event.tags, 'd') ?? event.id,
    original: event,
    sourceTags: event.tags,
    thumbnail,
    base: { ...data },
    data: { ...data },
  };
}

const PRESERVED_TAGS = new Set(['title', 'price', 'stock', 'quantity', 'status', 'visibility', 't', 'location', 'summary', 'd', 'client']);

function buildTags(row: Row): string[][] {
  const extra = row.sourceTags.filter(([n]) => !PRESERVED_TAGS.has(n));
  const tags: string[][] = [['d', row.id], ...extra];
  tags.push(['title', row.data.title]);
  if (row.data.priceAmount.trim()) {
    tags.push(['price', row.data.priceAmount.trim(), row.data.priceCurrency.trim().toUpperCase() || 'USD']);
  }
  if (row.data.stock.trim() !== '') tags.push(['stock', row.data.stock.trim()]);
  tags.push(['visibility', row.data.status]);
  tags.push(['status', row.data.status === 'hidden' ? 'sold' : 'active']);
  for (const cat of row.data.categories.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)) {
    tags.push(['t', cat]);
  }
  if (row.data.location.trim()) tags.push(['location', row.data.location.trim()]);
  if (row.data.summary.trim()) tags.push(['summary', row.data.summary.trim()]);
  return tags;
}

function isDirty(row: Row): boolean {
  const a = row.base, b = row.data;
  return (
    a.title !== b.title || a.priceAmount !== b.priceAmount || a.priceCurrency !== b.priceCurrency ||
    a.stock !== b.stock || a.status !== b.status || a.categories !== b.categories ||
    a.location !== b.location || a.summary !== b.summary
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function EditCell({ value, dirty, placeholder, onChange, className = '', numeric }: {
  value: string; dirty?: boolean; placeholder?: string;
  onChange: (v: string) => void; className?: string; numeric?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode={numeric ? 'decimal' : undefined}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-purple-400 rounded px-1 py-0.5 text-sm min-w-0 ${dirty ? 'text-amber-600 dark:text-amber-400' : ''} ${className}`}
    />
  );
}

function Thumbnail({ src, title }: { src: string; title: string }) {
  if (!src) {
    return (
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border">
        <Package className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      className="w-10 h-10 rounded-md object-cover flex-shrink-0 border"
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

// ── bulk action bar ────────────────────────────────────────────────────────

interface BulkBarProps {
  count: number;
  onSaveSelected: () => void;
  onDeleteSelected: () => void;
  onApplyStatus: (s: Visibility) => void;
  onApplyCategories: (c: string) => void;
  onApplyLocation: (l: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  onClearSelection: () => void;
}

function BulkActionBar({
  count, onSaveSelected, onDeleteSelected, onApplyStatus,
  onApplyCategories, onApplyLocation, isSaving, isDeleting, onClearSelection,
}: BulkBarProps) {
  const [catInput, setCatInput] = useState('');
  const [locInput, setLocInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Selection badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className="bg-purple-600 text-white border-0 text-xs">
          {count} selected
        </Badge>
        <button
          onClick={onClearSelection}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear
        </button>
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      {/* Apply status to all selected */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Set status:</span>
        <Select onValueChange={v => onApplyStatus(v as Visibility)}>
          <SelectTrigger className="h-7 text-xs w-28 border-purple-300 dark:border-purple-600">
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on-sale">On Sale</SelectItem>
            <SelectItem value="pre-order">Pre-Order</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apply categories */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs text-muted-foreground flex-shrink-0">Set categories:</span>
        <input
          value={catInput}
          onChange={e => setCatInput(e.target.value)}
          placeholder="art, digital…"
          className="h-7 text-xs border border-purple-300 dark:border-purple-600 rounded px-2 bg-white dark:bg-gray-900 w-32 min-w-0"
        />
        <button
          onClick={() => { if (catInput.trim()) { onApplyCategories(catInput.trim()); setCatInput(''); } }}
          className="text-xs px-2 py-1 rounded bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors flex-shrink-0"
        >
          Apply
        </button>
      </div>

      {/* Apply location */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs text-muted-foreground flex-shrink-0">Set location:</span>
        <input
          value={locInput}
          onChange={e => setLocInput(e.target.value)}
          placeholder="Worldwide…"
          className="h-7 text-xs border border-purple-300 dark:border-purple-600 rounded px-2 bg-white dark:bg-gray-900 w-28 min-w-0"
        />
        <button
          onClick={() => { if (locInput.trim()) { onApplyLocation(locInput.trim()); setLocInput(''); } }}
          className="text-xs px-2 py-1 rounded bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors flex-shrink-0"
        >
          Apply
        </button>
      </div>

      <div className="flex-1" />

      {/* Save + Delete selected */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          onClick={onSaveSelected}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs px-3"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Save {count}
        </Button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              disabled={isDeleting}
              className="h-7 text-xs px-3"
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
              Delete {count}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {count} listing{count !== 1 ? 's' : ''}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will publish NIP-09 deletion events for <strong>{count}</strong> selected listing{count !== 1 ? 's' : ''} and remove them from Nostr marketplaces. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setDeleteOpen(false); onDeleteSelected(); }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete {count}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function BulkUpdater() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['bulk-updater-products', user?.pubkey],
    enabled: !!user?.pubkey,
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ kinds: [30402], authors: [user!.pubkey], limit: 500 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) }
      );
      const map = new Map<string, NostrEvent>();
      for (const ev of events) {
        const d = getTag(ev.tags, 'd') ?? ev.id;
        const existing = map.get(d);
        if (!existing || ev.created_at > existing.created_at) map.set(d, ev);
      }
      const parsed = [...map.values()]
        .sort((a, b) => (getTag(a.tags, 'title') ?? '').localeCompare(getTag(b.tags, 'title') ?? ''))
        .map(parseRow);
      setRows(parsed);
      setSelectedIds(new Set());
      return parsed;
    },
  });

  const dirtyCount = useMemo(() => rows.filter(isDirty).length, [rows]);
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

  // ── selection ──────────────────────────────────────────────────────────

  const toggleRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === rows.length ? new Set() : new Set(rows.map(r => r.id))
    );
  }, [rows]);

  // ── per-row edits ──────────────────────────────────────────────────────

  const updateRow = useCallback((id: string, field: keyof RowData, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, data: { ...r.data, [field]: value } } : r));
    setSavedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  }, []);

  const revertRow = useCallback((id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, data: { ...r.base } } : r));
    setSavedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  }, []);

  // ── bulk field apply ───────────────────────────────────────────────────

  const applyFieldToSelected = useCallback((field: keyof RowData, value: string) => {
    setRows(prev => prev.map(r =>
      selectedIds.has(r.id) ? { ...r, data: { ...r.data, [field]: value } } : r
    ));
    setSavedIds(prev => {
      const s = new Set(prev);
      selectedIds.forEach(id => s.delete(id));
      return s;
    });
  }, [selectedIds]);

  // ── save ───────────────────────────────────────────────────────────────

  const saveRow = useCallback(async (row: Row) => {
    setSavingIds(prev => new Set(prev).add(row.id));
    try {
      await publishEvent({ kind: 30402, content: row.original.content, tags: buildTags(row) });
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, base: { ...r.data } } : r));
      setSavedIds(prev => new Set(prev).add(row.id));
      toast({ title: 'Saved', description: `"${row.data.title}" updated.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to publish.', variant: 'destructive' });
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(row.id); return s; });
    }
  }, [publishEvent, toast]);

  const saveSelected = useCallback(async () => {
    setBulkSaving(true);
    const targets = rows.filter(r => selectedIds.has(r.id));
    for (const row of targets) await saveRow(row);
    setBulkSaving(false);
    toast({ title: 'Done', description: `Saved ${targets.length} listing${targets.length !== 1 ? 's' : ''}.` });
  }, [rows, selectedIds, saveRow, toast]);

  const saveAll = useCallback(async () => {
    const dirty = rows.filter(isDirty);
    for (const row of dirty) await saveRow(row);
  }, [rows, saveRow]);

  // ── delete ─────────────────────────────────────────────────────────────

  const deleteRow = useCallback(async (row: Row) => {
    setDeletingIds(prev => new Set(prev).add(row.id));
    try {
      await publishEvent({
        kind: 5,
        content: `Deleted listing: ${row.data.title}`,
        tags: [
          ['e', row.original.id],
          ['a', `30402:${row.original.pubkey}:${row.id}`],
          ['k', '30402'],
        ],
      });
      setRows(prev => prev.filter(r => r.id !== row.id));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(row.id); return s; });
      toast({ title: 'Deleted', description: `"${row.data.title}" removed.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(row.id); return s; });
    }
  }, [publishEvent, toast]);

  const deleteSelected = useCallback(async () => {
    setBulkDeleting(true);
    const targets = rows.filter(r => selectedIds.has(r.id));
    for (const row of targets) await deleteRow(row);
    setBulkDeleting(false);
    setSelectedIds(new Set());
  }, [rows, selectedIds, deleteRow]);

  // ── render ─────────────────────────────────────────────────────────────

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">You must be logged in to use the Bulk Updater.</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-red-500 text-sm">Failed to load listings.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Package className="h-10 w-10 opacity-40" />
        <p className="text-sm">No NIP-99 listings found for your pubkey.</p>
        <p className="text-xs opacity-70">Create products first in the Products tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{rows.length} listing{rows.length !== 1 ? 's' : ''}</span>
          {dirtyCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
              {dirtyCount} unsaved
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reload
          </Button>
          {dirtyCount > 0 && (
            <Button size="sm" onClick={saveAll} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save All ({dirtyCount})
            </Button>
          )}
        </div>
      </div>

      {/* Bulk action bar — shown when rows are selected */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onSaveSelected={saveSelected}
          onDeleteSelected={deleteSelected}
          onApplyStatus={v => applyFieldToSelected('status', v)}
          onApplyCategories={v => applyFieldToSelected('categories', v)}
          onApplyLocation={v => applyFieldToSelected('location', v)}
          isSaving={bulkSaving}
          isDeleting={bulkDeleting}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Spreadsheet table */}
      <div className="rounded-lg border overflow-auto">
        <table className="w-full text-sm border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {/* Select-all checkbox */}
              <th className="px-3 py-2 w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? 'indeterminate' : undefined}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  className="border-muted-foreground"
                />
              </th>
              <th className="text-left px-2 py-2 w-14"></th>
              <th className="text-left px-3 py-2 min-w-[160px]">Title</th>
              <th className="text-left px-3 py-2 w-24">Price</th>
              <th className="text-left px-3 py-2 w-20">Currency</th>
              <th className="text-left px-3 py-2 w-20">Stock</th>
              <th className="text-left px-3 py-2 w-28">Status</th>
              <th className="text-left px-3 py-2 min-w-[120px]">Categories</th>
              <th className="text-left px-3 py-2 min-w-[100px]">Location</th>
              <th className="text-left px-3 py-2 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dirty = isDirty(row);
              const saving = savingIds.has(row.id);
              const saved = savedIds.has(row.id);
              const deleting = deletingIds.has(row.id);
              const selected = selectedIds.has(row.id);

              return (
                <tr
                  key={row.id}
                  className={`border-b transition-colors ${
                    selected
                      ? 'bg-purple-50/60 dark:bg-purple-900/20'
                      : dirty
                      ? 'bg-amber-50/50 dark:bg-amber-900/10'
                      : saved
                      ? 'bg-green-50/50 dark:bg-green-900/10'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Row checkbox */}
                  <td className="px-3 py-1.5">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.data.title}`}
                      className="border-muted-foreground"
                    />
                  </td>

                  {/* Thumbnail */}
                  <td className="px-2 py-1.5">
                    <Thumbnail src={row.thumbnail} title={row.data.title} />
                  </td>

                  {/* Title */}
                  <td className="px-2 py-1">
                    <EditCell
                      value={row.data.title}
                      dirty={row.data.title !== row.base.title}
                      placeholder="Title"
                      onChange={v => updateRow(row.id, 'title', v)}
                    />
                  </td>

                  {/* Price */}
                  <td className="px-2 py-1">
                    <EditCell
                      value={row.data.priceAmount}
                      dirty={row.data.priceAmount !== row.base.priceAmount}
                      placeholder="0.00"
                      onChange={v => updateRow(row.id, 'priceAmount', v)}
                      numeric
                    />
                  </td>

                  {/* Currency */}
                  <td className="px-2 py-1">
                    <EditCell
                      value={row.data.priceCurrency}
                      dirty={row.data.priceCurrency !== row.base.priceCurrency}
                      placeholder="USD"
                      onChange={v => updateRow(row.id, 'priceCurrency', v.toUpperCase())}
                      className="uppercase w-16"
                    />
                  </td>

                  {/* Stock */}
                  <td className="px-2 py-1">
                    <EditCell
                      value={row.data.stock}
                      dirty={row.data.stock !== row.base.stock}
                      placeholder="∞"
                      onChange={v => updateRow(row.id, 'stock', v)}
                      numeric
                    />
                  </td>

                  {/* Status */}
                  <td className="px-2 py-1">
                    <Select
                      value={row.data.status}
                      onValueChange={v => updateRow(row.id, 'status', v as Visibility)}
                    >
                      <SelectTrigger className={`h-7 text-xs border-0 shadow-none focus:ring-1 focus:ring-purple-400 px-1 ${row.data.status !== row.base.status ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-sale">On Sale</SelectItem>
                        <SelectItem value="pre-order">Pre-Order</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Categories */}
                  <td className="px-2 py-1">
                    <EditCell
                      value={row.data.categories}
                      dirty={row.data.categories !== row.base.categories}
                      placeholder="art, digital"
                      onChange={v => updateRow(row.id, 'categories', v)}
                    />
                  </td>

                  {/* Location */}
                  <td className="px-2 py-1">
                    <EditCell
                      value={row.data.location}
                      dirty={row.data.location !== row.base.location}
                      placeholder="Worldwide"
                      onChange={v => updateRow(row.id, 'location', v)}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      {saved && !dirty && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      )}
                      {dirty && (
                        <button
                          onClick={() => revertRow(row.id)}
                          title="Revert changes"
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}

                      {/* Save */}
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving || !dirty}
                        title="Save changes"
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          dirty ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-muted-foreground/40 cursor-default'
                        }`}
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={deleting}
                            title="Delete from marketplaces"
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium transition-colors bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                          >
                            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will publish a NIP-09 deletion event for <strong>"{row.data.title}"</strong> and remove it from Nostr marketplaces.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRow(row)} className="bg-red-600 hover:bg-red-700 text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer credit */}
      <p className="text-xs text-center text-muted-foreground pt-1">
        Inspired by{' '}
        <a href="https://nip99-bulk-updater.vercel.app/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-0.5">
          Gamma Markets Bulk Updater <ExternalLink className="h-2.5 w-2.5" />
        </a>
        {' · '}Vibecoded with love by{' '}
        <a href="https://njump.me/yojimble@getalby.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">Yojimble</a>
        {' '}using{' '}
        <a href="https://soapbox.pub/mkstack" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">MKStack</a>
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Copy, Download, KeyRound, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBadgeCodeAdmin, usePrivateBadgeCodes, usePublicBadgeCodes } from '@/hooks/useBadgeCodes';
import type { NIP58BadgeDefinition } from '@/hooks/useNIP58Badges';
import { claimLink, formatBadgeCode } from '@/lib/badgeClaims';

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error('Could not copy. Select the text and copy it by hand.');
  }
}

/** Owner only: make claim codes for one badge and hand them out. */
export function BadgeCodesDialog({
  badge,
  open,
  onClose,
}: {
  badge: NIP58BadgeDefinition | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: pub } = usePublicBadgeCodes();
  const { data: priv } = usePrivateBadgeCodes();
  const { issueCodes } = useBadgeCodeAdmin();

  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setFresh([]);
  }, [open]);

  if (!badge) return null;

  const live = pub?.registry[badge.id]?.length ?? 0;
  const unused = priv?.codes[badge.id] ?? [];
  const slug = badge.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  const lines = (codes: string[]) => codes.map(formatBadgeCode).join('\n');
  const links = (codes: string[]) => codes.map((c) => claimLink(window.location.origin, badge.id, c)).join('\n');

  const generate = async () => {
    const n = Math.max(1, Math.min(100, Math.floor(count) || 1));
    setBusy(true);
    try {
      const codes = await issueCodes(badge.id, n);
      setFresh(codes);
      toast.success(`${codes.length} new ${codes.length === 1 ? 'code' : 'codes'} ready.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const CodeActions = ({ codes }: { codes: string[] }) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(lines(codes), 'Codes copied.')}>
        <Copy className="h-3.5 w-3.5" /> Copy codes
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(links(codes), 'Claim links copied.')}>
        <Link2 className="h-3.5 w-3.5" /> Copy claim links
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => download(`${slug}-claim-codes.txt`, lines(codes) + '\n')}
      >
        <Download className="h-3.5 w-3.5" /> Download .txt
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-orange-600" />
            Claim codes
          </DialogTitle>
          <DialogDescription>
            Codes for <strong>{badge.name}</strong>. Give one to each person. A code works once, then it is retired when
            you award the badge.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          <strong>{live}</strong> unused {live === 1 ? 'code is' : 'codes are'} live for this badge.
        </p>

        <div className="flex items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="code-count">How many new codes</Label>
            <Input
              id="code-count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-28"
            />
          </div>
          <Button onClick={generate} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Generate
          </Button>
        </div>

        {fresh.length > 0 && (
          <div className="space-y-2 rounded-lg border border-orange-300 bg-orange-50 p-3 dark:bg-orange-950/20">
            <p className="text-sm font-semibold">New codes</p>
            <Textarea readOnly rows={Math.min(fresh.length, 8)} value={lines(fresh)} className="font-mono text-xs" />
            <CodeActions codes={fresh} />
          </div>
        )}

        {priv && !priv.readable && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            The saved code list could not be opened with this account. Log in with the BitPopArt account (and a signer
            with NIP-44) to see or add codes.
          </p>
        )}

        {unused.length > 0 && (
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-semibold">All unused codes ({unused.length})</summary>
            <div className="mt-3 space-y-2">
              <Textarea readOnly rows={Math.min(unused.length, 10)} value={lines(unused)} className="font-mono text-xs" />
              <CodeActions codes={unused} />
            </div>
          </details>
        )}
      </DialogContent>
    </Dialog>
  );
}

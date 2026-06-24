import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LoginArea } from '@/components/auth/LoginArea';
import { useZap } from '@/hooks/useZap';
import { useLNURL } from '@/hooks/useLNURL';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import {
  Zap, Loader2, Copy, ExternalLink, CheckCircle2,
  ChevronDown, ChevronUp, Wallet, Smartphone, Bolt,
} from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

// Fallback lightning address for guest zaps
const GUEST_LIGHTNING_ADDRESS = 'bitpopart@walletofsatoshi.com';

interface ZapButtonProps {
  authorPubkey: string;
  lightningAddress?: string;
  event?: NostrEvent;
  eventTitle?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showLabel?: boolean;
  /** When true, always show the button even if the viewer is the author */
  alwaysShow?: boolean;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000, 5000, 10000];

// ── What is a Zap? explainer ──────────────────────────────────────────────────

function WhatIsAZap() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-orange-200 dark:border-orange-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-semibold text-orange-700 dark:text-orange-300"
      >
        <span className="flex items-center gap-2">
          <Zap className="h-4 w-4 fill-current" />
          What is a Zap? ⚡
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 py-4 bg-white dark:bg-gray-900 space-y-3 text-sm text-muted-foreground">
          <p>
            A <strong className="text-foreground">Zap</strong> is an instant Bitcoin micropayment sent
            directly over the <strong className="text-foreground">Lightning Network</strong> — no bank,
            no middleman, no fees beyond a few millisatoshis.
          </p>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">⚡</span>
              <p><strong className="text-foreground">Instant</strong> — payments arrive in seconds anywhere in the world.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">🪙</span>
              <p><strong className="text-foreground">Sats</strong> — the unit is <em>satoshis</em> (1 Bitcoin = 100,000,000 sats). Even 21 sats is a real tip!</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">🔓</span>
              <p><strong className="text-foreground">Open</strong> — built on Bitcoin &amp; Nostr, fully decentralized and censorship-resistant.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">🎨</span>
              <p><strong className="text-foreground">For creators</strong> — Zaps let fans support artists directly, 100% of the payment goes to the creator.</p>
            </div>
          </div>

          <Separator />

          <p className="text-xs">
            <strong className="text-foreground">How to pay?</strong> Scan the QR code above with any
            Bitcoin Lightning wallet — e.g.{' '}
            <a href="https://primal.net" target="_blank" rel="noopener noreferrer" className="underline text-orange-600">Primal</a>,{' '}
            <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline text-orange-600">Alby</a>,{' '}
            <a href="https://walletofsatoshi.com" target="_blank" rel="noopener noreferrer" className="underline text-orange-600">Wallet of Satoshi</a>, or{' '}
            <a href="https://phoenix.acinq.co" target="_blank" rel="noopener noreferrer" className="underline text-orange-600">Phoenix</a>.
          </p>
          <p className="text-xs">
            No wallet yet?{' '}
            <a href="https://walletofsatoshi.com" target="_blank" rel="noopener noreferrer" className="underline text-orange-600 font-medium">
              Wallet of Satoshi
            </a>{' '}
            is the easiest way to get started — free, mobile, no KYC needed.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Guest Lightning Pay (no Nostr login required) ─────────────────────────────

interface GuestZapPanelProps {
  lightningAddress: string;
  recipientName: string;
  recipientImage?: string;
  eventTitle?: string;
  onClose: () => void;
}

function GuestZapPanel({ lightningAddress, recipientName, recipientImage, eventTitle, onClose }: GuestZapPanelProps) {
  const [amount, setAmount] = useState(21);
  const [customAmount, setCustomAmount] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { lnurlData, isLoading: lnurlLoading, getZapInvoice } = useLNURL(lightningAddress);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const generateInvoice = async () => {
    if (!lnurlData) return;
    setIsGenerating(true);
    setError(null);
    setInvoice(null);
    setQrDataUrl(null);

    try {
      const inv = await getZapInvoice(finalAmount);
      if (!inv) {
        setError('Could not generate invoice. Please try again.');
        return;
      }
      setInvoice(inv);
      const qr = await QRCode.toDataURL(`lightning:${inv}`, {
        width: 260,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      });
      setQrDataUrl(qr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenWallet = () => {
    if (invoice) window.open(`lightning:${invoice}`, '_blank');
  };

  const handleCopy = async () => {
    if (!invoice) return;
    await navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmountSelect = (a: number) => { setAmount(a); setCustomAmount(''); setInvoice(null); setQrDataUrl(null); };
  const handleCustomChange = (v: string) => { setCustomAmount(v); setInvoice(null); setQrDataUrl(null); };

  return (
    <div className="space-y-5">
      {/* Recipient */}
      <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipientImage} alt={recipientName} />
          <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{recipientName}</p>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Zap className="h-3 w-3 text-orange-500 fill-current" />
            {lightningAddress}
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-300 shrink-0">
          ⚡ Lightning
        </Badge>
      </div>

      {/* Amount picker */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Choose amount (sats)</Label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map(a => (
            <Button
              key={a}
              variant={amount === a && !customAmount ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAmountSelect(a)}
              className={`text-xs ${amount === a && !customAmount ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white' : ''}`}
            >
              {a.toLocaleString()}
            </Button>
          ))}
        </div>
        <Input
          type="number"
          placeholder="Custom amount…"
          value={customAmount}
          onChange={e => handleCustomChange(e.target.value)}
          min="1"
          className="mt-1"
        />
      </div>

      {/* QR + Invoice area */}
      {!invoice ? (
        <Button
          onClick={generateInvoice}
          disabled={isGenerating || lnurlLoading || !lnurlData || isNaN(finalAmount) || finalAmount <= 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          size="lg"
        >
          {isGenerating || lnurlLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
          ) : (
            <><Zap className="h-4 w-4 mr-2 fill-current" />Generate Lightning Invoice</>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          {/* QR Code */}
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-2xl overflow-hidden border-4 border-orange-400 shadow-lg">
                <img src={qrDataUrl} alt="Lightning invoice QR" className="w-[220px] h-[220px] block" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan with any Lightning wallet to pay {finalAmount.toLocaleString()} sats
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleOpenWallet}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Open in Wallet
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 text-xs transition-colors ${copied ? 'border-green-500 text-green-600' : ''}`}
              onClick={handleCopy}
            >
              {copied
                ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Copied!</>
                : <><Copy className="h-3.5 w-3.5" />Copy Invoice</>
              }
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => { setInvoice(null); setQrDataUrl(null); }}
          >
            ← Change amount
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* What is a Zap */}
      <WhatIsAZap />

      <Separator />

      {/* Login nudge */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Log in with Nostr to send a <strong>named Zap</strong> — your support will appear publicly on the creator's profile.
        </p>
        <LoginArea className="w-full" />
      </div>
    </div>
  );
}

// ── Main ZapButton ────────────────────────────────────────────────────────────

export function ZapButton({
  authorPubkey,
  lightningAddress,
  event,
  eventTitle,
  className = '',
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  alwaysShow = false,
}: ZapButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(21);
  const [comment, setComment] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const { user } = useCurrentUser();
  const author = useAuthor(authorPubkey || '');
  const metadata = author.data?.metadata;

  if (!authorPubkey) return null;

  const finalLightningAddress = lightningAddress || metadata?.lud16 || metadata?.lud06 || GUEST_LIGHTNING_ADDRESS;
  const guestLightningAddress = GUEST_LIGHTNING_ADDRESS;

  const { sendZap, isZapping, canZap } = useZap(finalLightningAddress);

  const displayName = metadata?.name || genUserName(authorPubkey);
  const profileImage = metadata?.picture;

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) setAmount(numValue);
  };

  const handleSendZap = async () => {
    if (!user) return;
    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (isNaN(finalAmount) || finalAmount <= 0) return;

    const success = await sendZap({
      recipientPubkey: authorPubkey,
      amount: finalAmount,
      comment: comment.trim(),
      eventId: event?.id,
    });

    if (success) {
      setIsOpen(false);
      setComment('');
      setCustomAmount('');
      setAmount(21);
    }
  };

  // Don't show zap button if zapping yourself (unless alwaysShow)
  if (!alwaysShow && user && user.pubkey === authorPubkey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${className} text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-600`}
        >
          <Zap className={`${size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'} fill-current`} />
          {showLabel && size !== 'icon' && 'Zap'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500 fill-current" />
            {user ? 'Send Lightning Tip' : 'Support with Lightning ⚡'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Guest view ── */}
          {!user ? (
            <GuestZapPanel
              lightningAddress={guestLightningAddress}
              recipientName={displayName}
              recipientImage={profileImage}
              eventTitle={eventTitle}
              onClose={() => setIsOpen(false)}
            />
          ) : !finalLightningAddress ? (
            <div className="text-center py-6 space-y-3">
              <Zap className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {displayName} doesn't have a Lightning address configured yet.
              </p>
            </div>
          ) : (
            /* ── Logged-in view ── */
            <>
              {/* Recipient Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profileImage} alt={displayName} />
                  <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {eventTitle || event?.content?.substring(0, 50) || 'Tip user'}
                  </p>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="space-y-3">
                <Label>Amount (sats)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((presetAmount) => (
                    <Button
                      key={presetAmount}
                      variant={amount === presetAmount && !customAmount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAmountSelect(presetAmount)}
                      className={`text-xs ${amount === presetAmount && !customAmount ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white' : ''}`}
                    >
                      {presetAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min="1"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a message with your tip..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  maxLength={280}
                />
                <p className="text-xs text-muted-foreground">{comment.length}/280</p>
              </div>

              {/* Summary */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <Badge variant="secondary" className="text-orange-700 dark:text-orange-300">
                    <Zap className="w-3 h-3 mr-1 fill-current" />
                    {(customAmount || amount).toLocaleString()} sats
                  </Badge>
                </div>
                {comment && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">"{comment}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1" disabled={isZapping}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendZap}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isZapping || !canZap || (!customAmount && !amount)}
                >
                  {isZapping ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2 fill-current" />Send Zap</>
                  )}
                </Button>
              </div>

              {/* What is a Zap */}
              <WhatIsAZap />

              {/* Info */}
              <p className="text-xs text-muted-foreground text-center">
                💡 Tips are sent via Lightning Network using NIP-57 zaps and appear publicly on Nostr.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoginArea } from '@/components/auth/LoginArea';
import { useZap } from '@/hooks/useZap';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { Zap, Loader2 } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface ZapButtonProps {
  authorPubkey: string;
  lightningAddress?: string;
  event?: NostrEvent;
  eventTitle?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showLabel?: boolean;
}

const PRESET_AMOUNTS = [21, 100, 500, 1000, 5000, 10000];

export function ZapButton({
  authorPubkey,
  lightningAddress,
  event,
  eventTitle,
  className = '',
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: ZapButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(21);
  const [comment, setComment] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const { user } = useCurrentUser();
  const author = useAuthor(authorPubkey);
  const metadata = author.data?.metadata;

  // Use provided lightning address or get from author's profile
  const finalLightningAddress = lightningAddress || metadata?.lud16 || metadata?.lud06;
  
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
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const handleSendZap = async () => {
    if (!user) return;

    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return;
    }

    const zapOptions = {
      recipientPubkey: authorPubkey,
      amount: finalAmount,
      comment: comment.trim(),
      eventId: event?.id,
    };

    const success = await sendZap(zapOptions);
    if (success) {
      setIsOpen(false);
      setComment('');
      setCustomAmount('');
      setAmount(21);
    }
  };

  // Don't show zap button if zapping yourself
  if (user && user.pubkey === authorPubkey) {
    return null;
  }

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

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Send Lightning Tip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!user ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                You need to be logged in to send Lightning tips.
              </p>
              <LoginArea className="max-w-60 mx-auto" />
            </div>
          ) : !finalLightningAddress ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {displayName} doesn't have a Lightning address configured yet.
              </p>
            </div>
          ) : (
            <>
              {/* Recipient Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
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
                      className="text-xs"
                    >
                      {presetAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="custom-amount" className="text-sm">Custom amount</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a message with your tip..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={280}
                />
                <p className="text-xs text-muted-foreground">
                  {comment.length}/280 characters
                </p>
              </div>

              {/* Summary */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <Badge variant="secondary" className="text-orange-700 dark:text-orange-300">
                    <Zap className="w-3 h-3 mr-1" />
                    {(customAmount || amount).toLocaleString()} sats
                  </Badge>
                </div>
                {comment && (
                  <p className="text-xs text-muted-foreground mt-2">
                    "{comment}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  disabled={isZapping}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendZap}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={isZapping || !canZap || (!customAmount && !amount)}
                >
                  {isZapping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Send Tip
                    </>
                  )}
                </Button>
              </div>

              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>💡 Tips are sent via Lightning Network using NIP-57 zaps.</p>
                <p>⚡ You'll need a Lightning wallet or WebLN extension to complete payment.</p>
                <p>🔒 Your tip will be publicly visible on Nostr as a zap receipt.</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

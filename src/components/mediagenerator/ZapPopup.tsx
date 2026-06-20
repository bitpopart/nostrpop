/**
 * ZapPopup
 * A Lightning Zap tip dialog targeting the BitPopArt admin account.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoginArea } from '@/components/auth/LoginArea';
import { useZap } from '@/hooks/useZap';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { Zap, Loader2, Heart } from 'lucide-react';

interface ZapPopupProps {
  open: boolean;
  onClose: () => void;
}

const ADMIN_LIGHTNING_ADDRESS = 'traveltelly@primal.net';
const ADMIN_NAME = 'BitPopArt';
const ADMIN_AVATAR = 'https://nostr.build/i/nostr.build_1cdc4f4551701244d7d580b3bd500be0049a2d29c39e7c44949557875a8d4f00.png';

const PRESET_AMOUNTS = [21, 100, 500, 1000, 5000, 10000];

export function ZapPopup({ open, onClose }: ZapPopupProps) {
  const [amount, setAmount] = useState(100);
  const [comment, setComment] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const { user } = useCurrentUser();
  const adminPubkey = getAdminPubkeyHex();
  const { sendZap, isZapping, canZap } = useZap(ADMIN_LIGHTNING_ADDRESS);

  const handleAmountSelect = (a: number) => {
    setAmount(a);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const n = parseInt(value);
    if (!isNaN(n) && n > 0) setAmount(n);
  };

  const handleSendZap = async () => {
    if (!user) return;
    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (isNaN(finalAmount) || finalAmount <= 0) return;

    const success = await sendZap({
      recipientPubkey: adminPubkey,
      amount: finalAmount,
      comment: comment.trim(),
    });

    if (success) {
      onClose();
      setComment('');
      setCustomAmount('');
      setAmount(100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <span className="text-2xl">⚡</span>
            Send a Tip to BitPopArt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Artist info */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <Avatar className="h-12 w-12">
              <AvatarImage src={ADMIN_AVATAR} alt={ADMIN_NAME} />
              <AvatarFallback>BP</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{ADMIN_NAME}</p>
              <p className="text-xs text-muted-foreground">{ADMIN_LIGHTNING_ADDRESS}</p>
              <p className="text-xs text-orange-600 mt-0.5">Travel photography & digital art 🌍</p>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-4 space-y-3">
              <Heart className="w-8 h-8 mx-auto text-orange-400" />
              <p className="text-sm text-muted-foreground">
                Log in to send a Lightning tip to support the artist.
              </p>
              <LoginArea className="max-w-60 mx-auto" />
            </div>
          ) : (
            <>
              {/* Preset amounts */}
              <div className="space-y-2">
                <Label>Amount (sats)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((a) => (
                    <Button
                      key={a}
                      variant={amount === a && !customAmount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAmountSelect(a)}
                      className={
                        amount === a && !customAmount
                          ? 'bg-orange-500 hover:bg-orange-600 text-white text-xs'
                          : 'text-xs'
                      }
                    >
                      {a.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Custom amount in sats"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min="1"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Say something nice… 💬"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  maxLength={280}
                />
                <p className="text-xs text-muted-foreground text-right">{comment.length}/280</p>
              </div>

              {/* Summary */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center justify-between">
                <span className="text-sm font-medium">You're sending:</span>
                <Badge className="bg-orange-500 text-white gap-1">
                  <Zap className="w-3 h-3" />
                  {(customAmount || amount).toLocaleString()} sats
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1" disabled={isZapping}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendZap}
                  disabled={isZapping || !canZap}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isZapping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Zap ⚡
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                💡 Sent via Lightning Network · NIP-57 zap receipt published to Nostr
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

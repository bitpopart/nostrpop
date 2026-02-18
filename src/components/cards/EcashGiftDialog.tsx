import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEcash } from '@/hooks/useEcash';
import { useToast } from '@/hooks/useToast';
import { Wallet } from 'lucide-react';

interface EcashGiftDialogProps {
  cardTitle: string;
  cardUrl?: string;
  children: React.ReactNode;
}

export function EcashGiftDialog({ cardTitle, cardUrl, children }: EcashGiftDialogProps) {
  const { toast } = useToast();
  const { openEcashWallet } = useEcash();

  const [ecashAmount, setEcashAmount] = useState('1000'); // Default 1000 sats
  const [ecashMessage, setEcashMessage] = useState('');
  const [ecashRecipient, setEcashRecipient] = useState(''); // Custom recipient for ecash gift
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = cardUrl || window.location.href;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-orange-500" />
            Share Card with Ecash Gift 🥜
          </DialogTitle>
          <DialogDescription>
            Send this beautiful card along with an ecash gift to anyone
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ecash Gift Details</CardTitle>
            <CardDescription>
              Add an ecash gift to make your card extra special
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ecash-recipient">
                Recipient Ecash Address
                <span className="text-xs text-muted-foreground ml-2">(e.g., friend@enuts.cash)</span>
              </Label>
              <Input
                id="ecash-recipient"
                type="text"
                placeholder="friend@wallet.cashu"
                value={ecashRecipient}
                onChange={(e) => setEcashRecipient(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Works with any Cashu wallet address (Minibits, eNuts, Cashu.me, etc.)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ecash-amount">Gift Amount (sats)</Label>
              <div className="flex gap-2">
                <Input
                  id="ecash-amount"
                  type="number"
                  placeholder="1000"
                  value={ecashAmount}
                  onChange={(e) => setEcashAmount(e.target.value)}
                  min="1"
                />
                <div className="flex gap-1">
                  {['100', '1000', '5000', '10000'].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setEcashAmount(amount)}
                    >
                      {parseInt(amount) >= 1000 ? `${parseInt(amount) / 1000}k` : amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ecash-message">Personal Message (optional)</Label>
              <Textarea
                id="ecash-message"
                placeholder="Enjoy this beautiful card! 🎨"
                value={ecashMessage}
                onChange={(e) => setEcashMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Card Preview */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                📨 Card: "{cardTitle}"
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                🔗 {shareUrl}
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>🥜 How it works:</strong>
                <br />
                {ecashRecipient.trim() ? (
                  <>
                    1. Your ecash wallet will open to send <strong>{ecashAmount} sats</strong> to{' '}
                    <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">{ecashRecipient.trim()}</code>
                    <br />
                    2. Share the card link with them separately (via message, email, etc.)
                  </>
                ) : (
                  <>
                    Enter the recipient's ecash address above to send them a gift along with this card
                  </>
                )}
              </p>
            </div>
            
            <Button
              onClick={() => {
                const amount = parseInt(ecashAmount);
                if (isNaN(amount) || amount < 1) {
                  toast({
                    title: "Invalid Amount",
                    description: "Please enter a valid ecash amount in sats.",
                    variant: "destructive"
                  });
                  return;
                }

                const recipient = ecashRecipient.trim();
                
                // Validate recipient format (basic check for @ symbol)
                if (!recipient || !recipient.includes('@')) {
                  toast({
                    title: "Recipient Required",
                    description: "Please enter a valid ecash address (e.g., user@wallet.cashu)",
                    variant: "destructive"
                  });
                  return;
                }
                
                const message = ecashMessage.trim() || `Ecash gift with card: "${cardTitle}"! 🎨\n\nView the card here: ${shareUrl}`;
                openEcashWallet(amount, recipient, message);
                
                // Copy card URL to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                  toast({
                    title: "Card Link Copied! 📋",
                    description: "Share this link with the recipient so they can view the card.",
                  });
                });

                setIsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
              disabled={!ecashRecipient.trim()}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Send Card with Ecash Gift 🥜
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your ecash wallet will open, and the card link will be copied to your clipboard
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

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
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Wallet className="w-5 h-5 mr-2 text-orange-500" />
            Share Card 🥜
          </DialogTitle>
          <DialogDescription className="text-sm">
            Send an ecash gift with this card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ecash-recipient" className="text-sm">
              Recipient Address
            </Label>
            <Input
              id="ecash-recipient"
              type="text"
              placeholder="friend@wallet.cashu"
              value={ecashRecipient}
              onChange={(e) => setEcashRecipient(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Any Cashu wallet (Minibits, eNuts, etc.)
            </p>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="ecash-amount" className="text-sm">Gift Amount (sats)</Label>
            <div className="flex gap-2">
              <Input
                id="ecash-amount"
                type="number"
                placeholder="1000"
                value={ecashAmount}
                onChange={(e) => setEcashAmount(e.target.value)}
                min="1"
                className="text-sm"
              />
              <div className="flex gap-1">
                {['100', '1k', '5k', '10k'].map((label, idx) => {
                  const amount = ['100', '1000', '5000', '10000'][idx];
                  return (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setEcashAmount(amount)}
                      className="text-xs px-2"
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="ecash-message" className="text-sm">Message (optional)</Label>
            <Textarea
              id="ecash-message"
              placeholder="Enjoy! 🎨"
              value={ecashMessage}
              onChange={(e) => setEcashMessage(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Compact info box */}
          {ecashRecipient.trim() && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded text-xs">
              <p className="text-orange-800 dark:text-orange-200">
                💡 Sending <strong>{ecashAmount} sats</strong> to{' '}
                <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded break-all">
                  {ecashRecipient.trim()}
                </code>
              </p>
            </div>
          )}
          
          <Button
            onClick={() => {
              const amount = parseInt(ecashAmount);
              if (isNaN(amount) || amount < 1) {
                toast({
                  title: "Invalid Amount",
                  description: "Please enter a valid amount in sats.",
                  variant: "destructive"
                });
                return;
              }

              const recipient = ecashRecipient.trim();
              
              if (!recipient || !recipient.includes('@')) {
                toast({
                  title: "Recipient Required",
                  description: "Enter a valid ecash address",
                  variant: "destructive"
                });
                return;
              }
              
              const message = ecashMessage.trim() || `Gift with card: "${cardTitle}"! 🎨\n${shareUrl}`;
              openEcashWallet(amount, recipient, message);
              
              navigator.clipboard.writeText(shareUrl).then(() => {
                toast({
                  title: "Link Copied! 📋",
                  description: "Share with recipient",
                });
              });

              setIsOpen(false);
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            disabled={!ecashRecipient.trim()}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Send Gift 🥜
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Wallet opens, link copied to clipboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

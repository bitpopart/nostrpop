import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEcash } from '@/hooks/useEcash';
import { useToast } from '@/hooks/useToast';
import { Wallet, Gift, Info } from 'lucide-react';

interface EcashGiftDialogProps {
  cardTitle: string;
  cardUrl?: string;
  children: React.ReactNode;
}

export function EcashGiftDialog({ cardTitle, cardUrl, children }: EcashGiftDialogProps) {
  const { toast } = useToast();
  const { openEcashWallet, generateEcashTokenInstructions } = useEcash();

  const [ecashAmount, setEcashAmount] = useState('1000'); // Default 1000 sats
  const [ecashMessage, setEcashMessage] = useState('');
  const [ecashRecipient, setEcashRecipient] = useState(''); // Custom recipient for ecash gift
  const [ecashToken, setEcashToken] = useState(''); // For attaching tokens to cards
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = cardUrl || window.location.href;
  const tokenInstructions = generateEcashTokenInstructions(parseInt(ecashAmount) || 1000, cardTitle);

  const handleAttachToken = () => {
    if (!ecashToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please paste your ecash token to attach it to the card",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that it looks like a Cashu token
    if (!ecashToken.trim().startsWith('cashuA')) {
      toast({
        title: "Invalid Token",
        description: "Please paste a valid Cashu token (starts with 'cashuA')",
        variant: "destructive"
      });
      return;
    }
    
    // In a real implementation, this would save the token to the card event or storage
    // For now, we'll copy it to clipboard along with the card URL
    const shareMessage = `Check out this card with an ecash gift! 🎁\n\nCard: ${shareUrl}\n\nEcash Token (${ecashAmount} sats):\n${ecashToken.trim()}`;
    
    navigator.clipboard.writeText(shareMessage).then(() => {
      toast({
        title: "Token Attached! 🎁",
        description: "Card link + token copied to clipboard. Share with recipient!",
        duration: 5000,
      });
    });
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Wallet className="w-5 h-5 mr-2 text-orange-500" />
            Share Card 🥜
          </DialogTitle>
          <DialogDescription className="text-sm">
            Send ecash with this card or attach a token for anyone to redeem
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">
              <Wallet className="w-4 h-4 mr-1.5" />
              Send to Address
            </TabsTrigger>
            <TabsTrigger value="attach">
              <Gift className="w-4 h-4 mr-1.5" />
              Attach Token
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-3 mt-4">
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
          </TabsContent>

          <TabsContent value="attach" className="space-y-3 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-semibold">How to attach an ecash token:</p>
                  <ol className="list-decimal list-inside space-y-0.5 ml-1">
                    <li>{tokenInstructions.step1}</li>
                    <li>{tokenInstructions.step2}</li>
                    <li>{tokenInstructions.step3}</li>
                    <li>{tokenInstructions.step4}</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="token-amount" className="text-sm">Token Amount (sats)</Label>
              <div className="flex gap-2">
                <Input
                  id="token-amount"
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
              <Label htmlFor="ecash-token" className="text-sm">
                Paste Your Ecash Token
              </Label>
              <Textarea
                id="ecash-token"
                placeholder="cashuA..."
                value={ecashToken}
                onChange={(e) => setEcashToken(e.target.value)}
                rows={4}
                className="text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Create this token in your Cashu wallet app first
              </p>
            </div>

            {ecashToken.trim() && (
              <div className="bg-green-50 dark:bg-green-900/20 p-2.5 rounded text-xs">
                <p className="text-green-800 dark:text-green-200">
                  ✅ Token ready to attach! Anyone with the card link can redeem <strong>{ecashAmount} sats</strong>
                </p>
              </div>
            )}

            <Button
              onClick={handleAttachToken}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              disabled={!ecashToken.trim()}
            >
              <Gift className="mr-2 h-4 w-4" />
              Attach Token to Card 🎁
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Card link + token copied to clipboard
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

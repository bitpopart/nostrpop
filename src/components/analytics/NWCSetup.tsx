import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useNWCConfig } from '@/hooks/useNWC';
import { useToast } from '@/hooks/useToast';
import { Zap, Link as LinkIcon, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export function NWCSetup() {
  const { config, saveConfig, disconnect } = useNWCConfig();
  const [connectionString, setConnectionString] = useState(config.connectionString);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!connectionString.trim()) {
      toast({
        title: 'Connection String Required',
        description: 'Please enter your NWC connection string',
        variant: 'destructive',
      });
      return;
    }

    // Validate connection string format
    if (!connectionString.startsWith('nostr+walletconnect://')) {
      toast({
        title: 'Invalid Format',
        description: 'Connection string must start with nostr+walletconnect://',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);

    try {
      // Test the connection by parsing it
      const url = new URL(connectionString);
      const relay = url.searchParams.get('relay');
      const secret = url.searchParams.get('secret');
      const pubkey = url.host;

      if (!relay || !secret || !pubkey) {
        throw new Error('Missing required parameters in connection string');
      }

      // Save the config
      saveConfig({
        connectionString,
        isConnected: true,
      });

      toast({
        title: 'NWC Connected!',
        description: 'Your wallet is now connected. Refresh to see analytics.',
      });
    } catch (error) {
      console.error('NWC connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Invalid connection string',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectionString('');
    toast({
      title: 'Disconnected',
      description: 'NWC wallet disconnected',
    });
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Nostr Wallet Connect (NWC)
            </CardTitle>
            <CardDescription>
              Connect your Lightning wallet to see payment analytics
            </CardDescription>
          </div>
          {config.isConnected && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {!config.isConnected && (
            <Badge variant="outline">
              <XCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!config.isConnected ? (
          <>
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <div className="space-y-2">
                  <p className="font-semibold">How to Connect:</p>
                  <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                    <li>Open your Lightning wallet (Alby, Mutiny, etc.)</li>
                    <li>Go to Nostr Wallet Connect settings</li>
                    <li>Copy the connection string (starts with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">nostr+walletconnect://</code>)</li>
                    <li>Paste it below and click Connect</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="nwc-string">NWC Connection String</Label>
              <Input
                id="nwc-string"
                type="password"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder="nostr+walletconnect://..."
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Your connection string is stored locally and never sent to any server
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleConnect}
                disabled={isTesting || !connectionString.trim()}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isTesting ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://nwc.getalby.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get Alby NWC
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                Your Lightning wallet is connected! Analytics will now show payments from your wallet.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Connection String</Label>
              <Input
                type="password"
                value={config.connectionString}
                disabled
                className="font-mono text-xs"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDisconnect}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

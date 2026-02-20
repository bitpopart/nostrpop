import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNWCDiscovery } from '@/hooks/useNWC';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Zap, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

export function NWCSetup() {
  const { user } = useCurrentUser();
  const { data: nwcInfo, isLoading, refetch } = useNWCDiscovery();

  if (!user) {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Nostr Wallet Connect (NWC)
          </CardTitle>
          <CardDescription>
            Login to automatically discover your wallet connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Please log in with your Nostr account to access wallet analytics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Nostr Wallet Connect (NWC)
          </CardTitle>
          <CardDescription>
            Discovering wallet connection...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

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
              Automatically discovered from your Nostr account
            </CardDescription>
          </div>
          {nwcInfo ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline">
              <XCircle className="h-3 w-3 mr-1" />
              Not Found
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nwcInfo ? (
          <>
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <div className="space-y-2">
                  <p className="font-semibold">✅ Wallet Connected!</p>
                  <p className="text-sm">
                    Your NWC wallet info was automatically discovered from Nostr relays.
                    Switch to "NWC Wallet" data source below to see your payment analytics.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Relay:</span>
                <span className="font-mono text-xs">{nwcInfo.relay}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Wallet:</span>
                <span className="font-mono text-xs">{nwcInfo.pubkey.slice(0, 16)}...{nwcInfo.pubkey.slice(-16)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Discovery
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <div className="space-y-2">
                  <p className="font-semibold">No NWC Connection Found</p>
                  <p className="text-sm">
                    We couldn't find NWC wallet info on Nostr relays for your account.
                  </p>
                  <p className="text-sm font-semibold mt-3">How to set it up:</p>
                  <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                    <li>Install and open the Alby browser extension</li>
                    <li>Go to "Nostr Wallet Connect" in Alby settings</li>
                    <li>Enable NWC and it will publish to relays automatically</li>
                    <li>Come back here and click "Refresh Discovery"</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Discovery
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open('https://getalby.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get Alby Wallet
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

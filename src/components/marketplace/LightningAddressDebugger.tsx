import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { Zap, AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';

const LIGHTNING_ADDRESS = 'bitpopart@walletofsatoshi.com';

interface LNURLPayResponse {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  allowsNostr?: boolean;
  nostrPubkey?: string;
  tag: string;
}

export function LightningAddressDebugger() {
  const [lnurlData, setLnurlData] = useState<LNURLPayResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testInvoice, setTestInvoice] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<{
    url: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    responseText: string;
  } | null>(null);
  const { toast } = useToast();

  const lnurlEndpoint = `https://walletofsatoshi.com/.well-known/lnurlp/bitpopart`;

  const testLightningAddress = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setLnurlData(null);
    setDebugInfo(null);

    try {
      console.log('Testing Lightning address:', LIGHTNING_ADDRESS);
      console.log('LNURL endpoint:', lnurlEndpoint);

      // Test the LNURL endpoint
      const response = await fetch(lnurlEndpoint);
      const responseText = await response.text();

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response text:', responseText);

      setDebugInfo({
        url: lnurlEndpoint,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseText: responseText
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log('Parsed LNURL data:', data);

      if (data.tag !== 'payRequest') {
        throw new Error(`Invalid LNURL response: expected tag 'payRequest', got '${data.tag}'`);
      }

      setLnurlData(data);
      toast({
        title: "Lightning Address Valid! ✅",
        description: `Successfully connected to ${LIGHTNING_ADDRESS}`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Lightning address test failed:', err);
      setError(errorMessage);
      toast({
        title: "Lightning Address Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, lnurlEndpoint]);

  const generateTestInvoice = async () => {
    if (!lnurlData) {
      toast({
        title: "No LNURL Data",
        description: "Please test the Lightning address first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const amount = 1000; // 1000 sats
      const amountMsats = amount * 1000;

      // Check amount limits
      if (amountMsats < lnurlData.minSendable || amountMsats > lnurlData.maxSendable) {
        throw new Error(`Amount ${amount} sats is outside allowed range: ${Math.ceil(lnurlData.minSendable / 1000)}-${Math.floor(lnurlData.maxSendable / 1000)} sats`);
      }

      console.log('Requesting invoice from callback:', lnurlData.callback);
      console.log('Amount (msats):', amountMsats);

      const callbackUrl = new URL(lnurlData.callback);
      callbackUrl.searchParams.set('amount', amountMsats.toString());

      console.log('Callback URL:', callbackUrl.toString());

      const response = await fetch(callbackUrl.toString());
      const responseText = await response.text();

      console.log('Invoice response status:', response.status);
      console.log('Invoice response text:', responseText);

      if (!response.ok) {
        throw new Error(`Invoice request failed: HTTP ${response.status}`);
      }

      let invoiceData;
      try {
        invoiceData = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON in invoice response: ${responseText}`);
      }

      console.log('Invoice data:', invoiceData);

      if (invoiceData.status === 'ERROR') {
        throw new Error(invoiceData.reason || 'Unknown error from LNURL service');
      }

      if (!invoiceData.pr) {
        throw new Error('No payment request in invoice response');
      }

      setTestInvoice(invoiceData.pr);
      toast({
        title: "Test Invoice Generated! ⚡",
        description: `Successfully created invoice for ${amount} sats`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Invoice generation failed:', err);
      toast({
        title: "Invoice Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  useEffect(() => {
    // Auto-test on component mount
    testLightningAddress();
  }, [testLightningAddress]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Lightning Address Debugger</span>
          </CardTitle>
          <CardDescription>
            Debug and test the Lightning address: {LIGHTNING_ADDRESS}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testLightningAddress}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Lightning Address'}
            </Button>
            <Button
              onClick={() => window.open('https://walletofsatoshi.com/.well-known/lnurlp/bitpopart', '_blank')}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open LNURL Endpoint
            </Button>
          </div>

          {/* Status */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lnurlData && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Lightning address is valid and responding correctly!
              </AlertDescription>
            </Alert>
          )}

          {/* LNURL Data */}
          {lnurlData && (
            <div className="space-y-3">
              <h4 className="font-medium">LNURL Pay Data:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Min Sendable:</span>
                  <Badge variant="outline" className="ml-2">
                    {Math.ceil(lnurlData.minSendable / 1000)} sats
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Max Sendable:</span>
                  <Badge variant="outline" className="ml-2">
                    {Math.floor(lnurlData.maxSendable / 1000).toLocaleString()} sats
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Nostr Support:</span>
                  <Badge variant={lnurlData.allowsNostr ? "default" : "secondary"} className="ml-2">
                    {lnurlData.allowsNostr ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Tag:</span>
                  <Badge variant="outline" className="ml-2">
                    {lnurlData.tag}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium">Callback URL:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1 break-all">
                    {lnurlData.callback}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(lnurlData.callback)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium">Metadata:</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                  {lnurlData.metadata}
                </code>
              </div>
            </div>
          )}

          {/* Test Invoice Generation */}
          {lnurlData && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Test Invoice Generation:</h4>
              <Button
                onClick={generateTestInvoice}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Test Invoice (1000 sats)'}
              </Button>

              {testInvoice && (
                <div className="space-y-2">
                  <span className="font-medium">Generated Invoice:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1 break-all">
                      {testInvoice}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(testInvoice)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => window.open(`lightning:${testInvoice}`, '_blank')}
                    className="w-full mt-2"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Lightning Wallet
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Debug Information */}
          {debugInfo && (
            <details className="border-t pt-4">
              <summary className="font-medium cursor-pointer">Debug Information</summary>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="font-medium">URL:</span>
                  <code className="ml-2 text-xs">{debugInfo.url}</code>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant={debugInfo.status === 200 ? "default" : "destructive"} className="ml-2">
                    {debugInfo.status} {debugInfo.statusText}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Response:</span>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                    {debugInfo.responseText}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
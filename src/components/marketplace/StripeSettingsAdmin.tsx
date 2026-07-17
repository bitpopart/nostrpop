/**
 * StripeSettingsAdmin
 *
 * Admin panel to connect Stripe. The admin enters their Stripe Publishable Key
 * so that buyers can check out with a credit / debit card via Stripe.
 */

import { useState } from 'react';
import { useStripeSettings } from '@/hooks/useStripeSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const SUPPORTED_CURRENCIES = [
  { code: 'eur', label: 'EUR — Euro' },
  { code: 'usd', label: 'USD — US Dollar' },
  { code: 'gbp', label: 'GBP — British Pound' },
  { code: 'chf', label: 'CHF — Swiss Franc' },
  { code: 'sek', label: 'SEK — Swedish Krona' },
  { code: 'nok', label: 'NOK — Norwegian Krone' },
  { code: 'dkk', label: 'DKK — Danish Krone' },
  { code: 'aud', label: 'AUD — Australian Dollar' },
  { code: 'cad', label: 'CAD — Canadian Dollar' },
  { code: 'jpy', label: 'JPY — Japanese Yen' },
];

export function StripeSettingsAdmin() {
  const { settings, updateSettings, isConfigured } = useStripeSettings();
  const { toast } = useToast();

  const [publishableKey, setPublishableKey] = useState(settings.publishableKey);
  const [showPk, setShowPk] = useState(false);
  const [currency, setCurrency] = useState(settings.currency || 'eur');
  const [enabled, setEnabled] = useState(settings.enabled);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(settings.paymentLinkUrl || '');

  const isDirty =
    publishableKey !== settings.publishableKey ||
    currency !== settings.currency ||
    enabled !== settings.enabled ||
    paymentLinkUrl !== (settings.paymentLinkUrl || '');

  const handleSave = () => {
    if (publishableKey && !publishableKey.startsWith('pk_')) {
      toast({
        title: 'Invalid key',
        description: 'Stripe Publishable Keys start with "pk_live_" or "pk_test_".',
        variant: 'destructive',
      });
      return;
    }

    if (paymentLinkUrl && !paymentLinkUrl.startsWith('https://')) {
      toast({
        title: 'Invalid Payment Link',
        description: 'Payment Link URL must start with "https://".',
        variant: 'destructive',
      });
      return;
    }

    updateSettings({ publishableKey, currency, enabled, paymentLinkUrl });
    toast({
      title: 'Stripe settings saved',
      description: publishableKey
        ? `Stripe is ${enabled ? 'enabled' : 'disabled'} — buyers can pay by card.`
        : 'Stripe key cleared.',
    });
  };

  const isTestMode = publishableKey.startsWith('pk_test_');
  const isLiveMode = publishableKey.startsWith('pk_live_');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex-shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-blue-700 dark:text-blue-300 text-lg leading-tight">
                  Stripe — Card Payments
                </h2>
                {isConfigured && settings.enabled ? (
                  <Badge className="bg-green-500 text-white border-0 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : isConfigured ? (
                  <Badge variant="secondary" className="text-xs">Configured — disabled</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Not configured</Badge>
                )}
                {isTestMode && (
                  <Badge className="bg-yellow-500 text-white border-0 text-xs">Test Mode</Badge>
                )}
                {isLiveMode && (
                  <Badge className="bg-emerald-600 text-white border-0 text-xs">Live Mode</Badge>
                )}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Accept credit and debit card payments at checkout. Buyers will be redirected to a secure Stripe payment page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-blue-500" />
            How to get your Stripe keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Go to{' '}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                dashboard.stripe.com/apikeys
              </a>
            </li>
            <li>Copy your <strong>Publishable key</strong> (starts with <code className="text-xs bg-muted px-1 py-0.5 rounded">pk_live_</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">pk_test_</code>)</li>
            <li>Paste it below and click <strong>Save</strong></li>
            <li>Enable the toggle to activate card payments at checkout</li>
          </ol>
          <div className="text-xs text-muted-foreground flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> For full card processing you need a deployed backend (Cloudflare Workers, Netlify Functions, etc.) with your Stripe Secret Key. The Publishable Key alone enables Stripe.js to render the payment form. Contact your developer or deploy with Shakespeare to add the backend.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Settings form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connection Settings</CardTitle>
          <CardDescription>
            Enter your Stripe API credentials to enable card payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-semibold">Enable Stripe at Checkout</p>
              <p className="text-xs text-muted-foreground">Show the "Pay by Card" option to customers</p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Publishable Key */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Publishable Key <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPk ? 'text' : 'password'}
                value={publishableKey}
                onChange={e => setPublishableKey(e.target.value)}
                placeholder="pk_live_... or pk_test_..."
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPk(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPk ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {publishableKey && !publishableKey.startsWith('pk_') && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Publishable keys must start with "pk_"
              </p>
            )}
            {isTestMode && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                Test mode — use <code>4242 4242 4242 4242</code> to test payments
              </p>
            )}
            {isLiveMode && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live mode — real card payments will be charged
              </p>
            )}
          </div>

          {/* Payment Link URL */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Stripe Payment Link URL</Label>
            <Input
              type="url"
              value={paymentLinkUrl}
              onChange={e => setPaymentLinkUrl(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Create a Payment Link in your{' '}
              <a
                href="https://dashboard.stripe.com/payment-links"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Stripe Dashboard → Payment Links
              </a>
              . Customers will be redirected to this URL at checkout. You can adjust prices and products directly in Stripe.
            </p>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Default Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Currency used for Stripe checkout. Must match your Stripe account's supported currencies.
            </p>
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={!isDirty}
            className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
          >
            <Save className="h-4 w-4" />
            {isDirty ? 'Save Stripe Settings' : 'Settings Saved'}
          </Button>
        </CardContent>
      </Card>

      {/* Test checklist */}
      {isConfigured && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Stripe is configured! Checkout options:
            </p>
            <ul className="text-xs text-green-600 dark:text-green-400 space-y-1 list-disc list-inside">
              <li>Buyers will see a <strong>"Pay by Card"</strong> button alongside the Lightning option</li>
              <li>Clicking "Pay by Card" opens a Stripe Checkout page</li>
              {isTestMode && (
                <li>Test card: <code className="bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded">4242 4242 4242 4242</code>, any future expiry &amp; CVC</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

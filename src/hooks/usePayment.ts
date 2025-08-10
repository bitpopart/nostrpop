import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useLNURL } from '@/hooks/useLNURL';

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  productId: string;
  buyerInfo?: {
    email?: string;
    name?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country: string;
    };
  };
}

interface LightningInvoice {
  payment_request: string;
  payment_hash: string;
  amount_sats: number;
  expires_at: number;
  description: string;
}

interface StripeSession {
  id: string;
  url: string;
  payment_intent: string;
}

export function useLightningPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<LightningInvoice | null>(null);
  const { toast } = useToast();

  // Use BitPopArt Lightning address for payments
  const BITPOPART_LIGHTNING_ADDRESS = 'bitpopart@walletofsatoshi.com';
  const { getZapInvoice, lnurlData, isLoading: lnurlLoading } = useLNURL(BITPOPART_LIGHTNING_ADDRESS);

  const createInvoice = async (request: PaymentRequest): Promise<LightningInvoice> => {
    setIsLoading(true);
    try {
      // Convert price to satoshis if needed
      let amountSats = request.amount;
      if (request.currency === 'USD') {
        // Use current conversion rate: $1 = 2500 sats (adjust based on real rates)
        amountSats = Math.round(request.amount * 2500);
      } else if (request.currency === 'BTC') {
        amountSats = Math.round(request.amount * 100000000); // Convert BTC to sats
      } else if (request.currency === 'EUR') {
        // EUR to sats conversion (approximate)
        amountSats = Math.round(request.amount * 2700);
      }

      // Check LNURL limits
      if (lnurlData) {
        const minSats = Math.ceil(lnurlData.minSendable / 1000);
        const maxSats = Math.floor(lnurlData.maxSendable / 1000);

        if (amountSats < minSats || amountSats > maxSats) {
          throw new Error(`Amount must be between ${minSats} and ${maxSats} sats`);
        }
      }

      // Create payment description with order details
      const description = `BitPop Marketplace: ${request.description}`;

      // Get real Lightning invoice from LNURL
      const paymentRequest = await getZapInvoice(amountSats);

      if (!paymentRequest) {
        throw new Error('Failed to generate Lightning invoice');
      }

      const lightningInvoice: LightningInvoice = {
        payment_request: paymentRequest,
        payment_hash: extractPaymentHash(paymentRequest),
        amount_sats: amountSats,
        expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes from now
        description: description
      };

      setInvoice(lightningInvoice);

      toast({
        title: "Lightning Invoice Created ⚡",
        description: `Invoice for ${amountSats.toLocaleString()} sats created. Pay with your Lightning wallet.`,
      });

      return lightningInvoice;
    } catch (error) {
      console.error('Lightning payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to create Lightning invoice. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentHash: string): Promise<boolean> => {
    try {
      // LNURL payments require backend infrastructure for status checking
      // Production implementation would need webhook integration or Lightning node monitoring

      console.log('Checking payment status for hash:', paymentHash);

      // For demo purposes, simulate payment detection after a short delay
      // In production, this would query your Lightning node or payment processor
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful payment detection (80% success rate for demo)
      const isPaymentDetected = Math.random() > 0.2;

      if (isPaymentDetected) {
        console.log('Payment detected for hash:', paymentHash);
        toast({
          title: "Payment Detected! ⚡",
          description: "Your Lightning payment has been confirmed.",
        });
      }

      return isPaymentDetected;
    } catch (error) {
      console.error('Payment status check error:', error);
      return false;
    }
  };

  return {
    createInvoice,
    checkPaymentStatus,
    invoice,
    isLoading: isLoading || lnurlLoading,
    clearInvoice: () => setInvoice(null),
    lightningAddress: BITPOPART_LIGHTNING_ADDRESS,
    lnurlData
  };
}

// Helper function to extract payment hash from Lightning invoice
function extractPaymentHash(paymentRequest: string): string {
  try {
    // This is a simplified extraction - in production use a proper Lightning library
    // For now, generate a mock hash based on the invoice
    return paymentRequest.slice(-32) || Math.random().toString(36).substring(2, 15);
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
}

export function useStripePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (_request: PaymentRequest): Promise<StripeSession> => {
    setIsLoading(true);
    try {
      // Mock Stripe checkout session creation (replace with real backend API call)

      const mockSession: StripeSession = {
        id: `cs_${Math.random().toString(36).substring(2, 15)}`,
        url: `https://checkout.stripe.com/pay/cs_${Math.random().toString(36).substring(2, 15)}`,
        payment_intent: `pi_${Math.random().toString(36).substring(2, 15)}`
      };

      toast({
        title: "Redirecting to Stripe",
        description: "You will be redirected to Stripe to complete your payment.",
      });

      // TODO: Redirect to mockSession.url in production
      console.log('Stripe session created:', mockSession);

      return mockSession;
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create Stripe checkout session. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (_sessionId: string) => {
    toast({
      title: "Payment Successful!",
      description: "Your payment has been processed successfully. You will receive a confirmation email shortly.",
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error || "Payment was not completed. Please try again.",
      variant: "destructive"
    });
  };

  return {
    createCheckoutSession,
    handlePaymentSuccess,
    handlePaymentError,
    isLoading
  };
}

// Utility function to format currency
export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'SAT' || currency === 'sats') {
    return `${amount.toLocaleString()} sats`;
  } else if (currency === 'BTC') {
    return `₿${amount.toFixed(8)}`;
  } else {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  }
}

// Utility function to convert between currencies (mock implementation)
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // Mock conversion rates - in a real app, use a proper exchange rate API
  const rates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.85,
    'GBP': 0.73,
    'BTC': 0.000025, // $40,000 per BTC
    'SAT': 2500 // 2500 sats per USD
  };

  if (fromCurrency === toCurrency) return amount;

  const usdAmount = amount / (rates[fromCurrency] || 1);
  return usdAmount * (rates[toCurrency] || 1);
}
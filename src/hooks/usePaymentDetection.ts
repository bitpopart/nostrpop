import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

interface PaymentDetectionOptions {
  paymentHash: string;
  expiresAt: number;
  onPaymentDetected: () => void;
  onPaymentExpired?: () => void;
  pollInterval?: number; // milliseconds
  verifyUrl?: string; // LNURL-verify URL for real payment detection
}

// LNURL-verify response shape
interface LNURLVerifyResponse {
  status: 'OK' | 'ERROR';
  settled: boolean;
  preimage: string | null;
  pr: string;
}

/**
 * Check payment status via the LNURL-verify URL.
 * This is the standard way for LNURL services to expose payment status.
 */
async function checkViaVerifyUrl(verifyUrl: string): Promise<boolean> {
  const res = await fetch(verifyUrl);
  if (!res.ok) return false;
  const data: LNURLVerifyResponse = await res.json();
  return data.status === 'OK' && data.settled === true;
}

export function usePaymentDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<boolean>(false);

  const stopDetection = useCallback(() => {
    abortRef.current = true;
    setIsDetecting(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startDetection = useCallback(async (options: PaymentDetectionOptions) => {
    const {
      paymentHash,
      expiresAt,
      onPaymentDetected,
      onPaymentExpired,
      pollInterval = 2000,
      verifyUrl,
    } = options;

    // Stop any existing detection
    stopDetection();
    abortRef.current = false;
    setIsDetecting(true);

    const pollPaymentStatus = async () => {
      // Stop if aborted
      if (abortRef.current) return;

      // Check if invoice has expired
      if (Date.now() >= expiresAt) {
        setIsDetecting(false);
        if (onPaymentExpired) {
          onPaymentExpired();
        } else {
          toast({
            title: 'Invoice Expired',
            description: 'The payment invoice has expired. Please generate a new one.',
            variant: 'destructive',
          });
        }
        return;
      }

      try {
        let paid = false;

        if (verifyUrl) {
          // Real detection via LNURL-verify
          paid = await checkViaVerifyUrl(verifyUrl);
        } else {
          // Fallback: cannot detect without a verify URL
          // Do nothing - wait for manual confirmation
          paid = false;
        }

        if (paid) {
          if (abortRef.current) return;
          setIsDetecting(false);
          toast({
            title: 'Payment Detected! ⚡',
            description: 'Your Lightning payment has been confirmed.',
          });
          onPaymentDetected();
          return;
        }

        // Continue polling
        if (!abortRef.current) {
          timerRef.current = setTimeout(pollPaymentStatus, pollInterval);
        }
      } catch (error) {
        console.error('Payment detection error:', error);
        // Keep polling on transient errors
        if (!abortRef.current && Date.now() < expiresAt) {
          timerRef.current = setTimeout(pollPaymentStatus, pollInterval * 2);
        } else {
          setIsDetecting(false);
        }
      }
    };

    // Log which mode we're using
    if (verifyUrl) {
      console.log('Payment detection: polling verify URL', verifyUrl);
    } else {
      console.log('Payment detection: no verify URL for hash', paymentHash, '- manual confirmation only');
    }

    // Start polling immediately
    pollPaymentStatus();
  }, [stopDetection, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isDetecting,
    startDetection,
    stopDetection,
  };
}

// Enhanced payment detection hook with WebLN integration
export function useEnhancedPaymentDetection() {
  const baseDetection = usePaymentDetection();
  const { toast } = useToast();

  const payWithWebLN = useCallback(async (
    paymentRequest: string,
    onSuccess: () => void,
    onFallback: () => void
  ) => {
    try {
      if (window.webln) {
        await window.webln.enable();
        await window.webln.sendPayment(paymentRequest);

        // WebLN payment successful
        toast({
          title: 'WebLN Payment Successful! ⚡',
          description: 'Payment completed through your browser wallet.',
        });

        onSuccess();
        return true;
      } else {
        // No WebLN available, fallback to manual payment
        onFallback();
        return false;
      }
    } catch (error) {
      console.error('WebLN payment failed:', error);

      toast({
        title: 'WebLN Payment Failed',
        description: 'Please pay manually with your Lightning wallet. We\'ll detect your payment automatically.',
        variant: 'destructive',
      });

      // Fallback to manual payment with detection
      onFallback();
      return false;
    }
  }, [toast]);

  const openLightningWallet = useCallback((paymentRequest: string) => {
    try {
      window.open(`lightning:${paymentRequest}`, '_blank');
    } catch (error) {
      console.error('Failed to open Lightning wallet:', error);

      // Fallback: copy to clipboard
      navigator.clipboard.writeText(paymentRequest).then(() => {
        toast({
          title: 'Invoice Copied',
          description: 'Lightning invoice copied to clipboard. Paste it in your wallet.',
        });
      }).catch(() => {
        toast({
          title: 'Manual Payment Required',
          description: 'Please copy the Lightning invoice manually and pay with your wallet.',
          variant: 'destructive',
        });
      });
    }
  }, [toast]);

  return {
    ...baseDetection,
    payWithWebLN,
    openLightningWallet,
  };
}

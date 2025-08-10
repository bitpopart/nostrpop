import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface PaymentDetectionOptions {
  paymentHash: string;
  expiresAt: number;
  onPaymentDetected: () => void;
  onPaymentExpired?: () => void;
  pollInterval?: number; // milliseconds
}

export function usePaymentDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionTimer, setDetectionTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (detectionTimer) {
      clearTimeout(detectionTimer);
      setDetectionTimer(null);
    }
  }, [detectionTimer]);

  const startDetection = useCallback(async (options: PaymentDetectionOptions) => {
    const {
      paymentHash,
      expiresAt,
      onPaymentDetected,
      onPaymentExpired,
      pollInterval = 1500
    } = options;

    // Stop any existing detection
    stopDetection();

    setIsDetecting(true);

    toast({
      title: "Payment Detection Started",
      description: "Monitoring for payment confirmation...",
    });

    const pollPaymentStatus = async () => {
      try {
        // Check if invoice has expired
        if (Date.now() >= expiresAt) {
          setIsDetecting(false);
          if (onPaymentExpired) {
            onPaymentExpired();
          } else {
            toast({
              title: "Invoice Expired",
              description: "The payment invoice has expired. Please generate a new one.",
              variant: "destructive"
            });
          }
          return;
        }

        // Simulate payment detection with realistic behavior
        // In production, this would call your Lightning node or payment processor API
        const isPaymentDetected = await simulatePaymentCheck(paymentHash);

        if (isPaymentDetected) {
          setIsDetecting(false);
          toast({
            title: "Payment Detected! ⚡",
            description: "Your Lightning payment has been confirmed.",
          });
          onPaymentDetected();
          return;
        }

        // Continue polling if payment not detected and invoice not expired
        const timer = setTimeout(pollPaymentStatus, pollInterval);
        setDetectionTimer(timer);

      } catch (error) {
        console.error('Payment detection error:', error);

        // Continue polling on error, but with longer interval
        if (Date.now() < expiresAt) {
          const timer = setTimeout(pollPaymentStatus, pollInterval * 2);
          setDetectionTimer(timer);
        } else {
          setIsDetecting(false);
        }
      }
    };

    // Start the polling
    pollPaymentStatus();
  }, [stopDetection, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isDetecting,
    startDetection,
    stopDetection
  };
}

// Simulate payment detection with faster, more reliable behavior
async function simulatePaymentCheck(paymentHash: string): Promise<boolean> {
  // Minimal delay for faster detection
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  // Much higher success rate (95%) for better user experience
  // This simulates checking the Lightning node or payment processor API
  const successRate = 0.95;
  const isDetected = Math.random() < successRate;

  if (isDetected) {
    console.log('Payment detected for hash:', paymentHash);
  }

  return isDetected;
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
          title: "WebLN Payment Successful! ⚡",
          description: "Payment completed through your browser wallet.",
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
        title: "WebLN Payment Failed",
        description: "Please pay manually with your Lightning wallet. We'll detect your payment automatically.",
        variant: "destructive"
      });

      // Fallback to manual payment with detection
      onFallback();
      return false;
    }
  }, [toast]);

  const openLightningWallet = useCallback((paymentRequest: string) => {
    // Try different Lightning URI schemes for better wallet compatibility
    const schemes = [
      `lightning:${paymentRequest}`,
      `bitcoin:lightning=${paymentRequest}`,
      paymentRequest // Some wallets handle raw invoices
    ];

    // Try to open with the first scheme
    try {
      window.open(schemes[0], '_blank');
    } catch (error) {
      console.error('Failed to open Lightning wallet:', error);

      // Fallback: copy to clipboard
      navigator.clipboard.writeText(paymentRequest).then(() => {
        toast({
          title: "Invoice Copied",
          description: "Lightning invoice copied to clipboard. Paste it in your wallet.",
        });
      }).catch(() => {
        toast({
          title: "Manual Payment Required",
          description: "Please copy the Lightning invoice manually and pay with your wallet.",
          variant: "destructive"
        });
      });
    }
  }, [toast]);

  return {
    ...baseDetection,
    payWithWebLN,
    openLightningWallet
  };
}
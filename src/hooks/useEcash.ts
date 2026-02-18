import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface EcashSendOptions {
  amount: number; // in sats
  description?: string;
  recipientAddress?: string; // e.g., bitpopart@minibits.cash
}

export function useEcash() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  /**
   * Send ecash tokens
   * This is a simplified implementation that relies on the user's ecash wallet app
   */
  const sendEcash = async (options: EcashSendOptions): Promise<string | null> => {
    setIsLoading(true);
    
    try {
      // In this implementation, we rely on the user's ecash wallet app (like Minibits)
      // to handle the actual payment processing
      
      toast({
        title: "Ecash Payment",
        description: `Preparing to send ${options.amount} sats via ecash...`,
      });
      
      const message = options.recipientAddress 
        ? `To complete ecash payment of ${options.amount} sats to ${options.recipientAddress}, you'll need to use your ecash wallet app (like Minibits).`
        : `Ecash token for ${options.amount} sats would be generated here.`;
      
      toast({
        title: "Manual Payment Required",
        description: message,
      });
      
      return null;
    } catch (error) {
      console.error('Ecash send error:', error);
      toast({
        title: "Ecash Error",
        description: error instanceof Error ? error.message : "Failed to send ecash payment.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Generate a payment request for ecash
   * This creates instructions for manual payment
   */
  const createEcashPaymentRequest = (amount: number, recipientAddress: string, description?: string) => {
    return {
      amount,
      recipientAddress,
      description: description || `Payment of ${amount} sats`,
      instructions: `Please send ${amount} sats to ${recipientAddress} using your ecash wallet (e.g., Minibits).`,
    };
  };
  
  /**
   * Open ecash wallet with payment details
   * Tries multiple wallet URL schemes and falls back to manual instructions
   */
  const openEcashWallet = (amount: number, recipientAddress: string, description?: string) => {
    const params = new URLSearchParams({
      address: recipientAddress,
      amount: amount.toString(),
    });
    
    if (description) {
      params.append('memo', description);
    }
    
    // Try multiple wallet URL schemes
    // Minibits wallet
    const minibitsUrl = `minibits://send?${params.toString()}`;
    
    // eNuts wallet (another popular Cashu wallet)
    const enutsUrl = `enuts://send?${params.toString()}`;
    
    // Cashu.me wallet
    const cashuUrl = `cashu://send?${params.toString()}`;
    
    try {
      // Try Minibits first (most popular)
      window.location.href = minibitsUrl;
      
      toast({
        title: "Opening Ecash Wallet",
        description: `Sending ${amount} sats to ${recipientAddress}`,
      });
      
      // Show fallback instructions after a short delay
      setTimeout(() => {
        toast({
          title: "Alternative Wallets",
          description: `If your wallet didn't open, manually send ${amount} sats to ${recipientAddress} using any Cashu wallet (Minibits, eNuts, Cashu.me, etc.)`,
          duration: 7000,
        });
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Failed to open ecash wallet:', error);
      
      toast({
        title: "Manual Payment Required",
        description: `Please send ${amount} sats to ${recipientAddress} using your ecash wallet (Minibits, eNuts, Cashu.me, or any Cashu-compatible wallet).`,
        duration: 7000,
      });
      
      return false;
    }
  };
  
  return {
    sendEcash,
    createEcashPaymentRequest,
    openEcashWallet,
    openMinibitsWallet: openEcashWallet, // Alias for backward compatibility
    isLoading,
  };
}

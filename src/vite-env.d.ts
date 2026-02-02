/// <reference types="vite/client" />

// WebLN types for Alby and other Lightning browser extensions
interface SendPaymentResponse {
  preimage: string;
}

interface WebLN {
  enable(): Promise<void>;
  sendPayment(paymentRequest: string): Promise<SendPaymentResponse>;
  makeInvoice(args: { amount?: number; defaultAmount?: number; minimumAmount?: number; maximumAmount?: number; defaultMemo?: string }): Promise<{ paymentRequest: string }>;
  signMessage(message: string): Promise<{ message: string; signature: string }>;
  verifyMessage(signature: string, message: string): Promise<void>;
}

interface Window {
  webln?: WebLN;
}

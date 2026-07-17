/**
 * useStripeSettings
 *
 * Persists Stripe configuration (publishable key + secret key) in localStorage.
 * The secret key is stored locally and used server-side only in a real deployment.
 * For this client-side implementation, it enables Stripe Checkout sessions via
 * the Stripe.js library loaded from the CDN.
 */

import { useState, useCallback } from 'react';

export interface StripeSettings {
  publishableKey: string;
  secretKey: string;
  enabled: boolean;
  currency: string;
  /** Optional: Stripe Payment Link URL (from Stripe Dashboard → Payment Links) */
  paymentLinkUrl: string;
}

const STRIPE_SETTINGS_KEY = 'nostrpop_stripe_settings';

function loadStripeSettings(): StripeSettings {
  try {
    const raw = localStorage.getItem(STRIPE_SETTINGS_KEY);
    return raw
      ? { publishableKey: '', secretKey: '', enabled: false, currency: 'eur', paymentLinkUrl: '', ...JSON.parse(raw) }
      : { publishableKey: '', secretKey: '', enabled: false, currency: 'eur', paymentLinkUrl: '' };
  } catch {
    return { publishableKey: '', secretKey: '', enabled: false, currency: 'eur', paymentLinkUrl: '' };
  }
}

function saveStripeSettings(settings: StripeSettings) {
  localStorage.setItem(STRIPE_SETTINGS_KEY, JSON.stringify(settings));
}

export function useStripeSettings() {
  const [settings, setSettings] = useState<StripeSettings>(loadStripeSettings);

  const updateSettings = useCallback((updates: Partial<StripeSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveStripeSettings(next);
      return next;
    });
  }, []);

  const isConfigured = Boolean(settings.publishableKey && settings.publishableKey.startsWith('pk_'));

  return {
    settings,
    updateSettings,
    isConfigured,
  };
}

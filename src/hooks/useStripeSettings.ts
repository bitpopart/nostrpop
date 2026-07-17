/**
 * useStripeSettings
 *
 * Persists Stripe configuration in localStorage and keeps all mounted
 * instances in sync via a custom "stripe-settings-updated" storage event.
 */

import { useState, useCallback, useEffect } from 'react';

export interface StripeSettings {
  publishableKey: string;
  secretKey: string;
  enabled: boolean;
  currency: string;
  /** Optional: Stripe Payment Link URL (from Stripe Dashboard → Payment Links) */
  paymentLinkUrl: string;
}

const STRIPE_SETTINGS_KEY = 'nostrpop_stripe_settings';
const STRIPE_SETTINGS_EVENT = 'stripe-settings-updated';

const EMPTY: StripeSettings = {
  publishableKey: '',
  secretKey: '',
  enabled: false,
  currency: 'eur',
  paymentLinkUrl: '',
};

export function loadStripeSettings(): StripeSettings {
  try {
    const raw = localStorage.getItem(STRIPE_SETTINGS_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function saveStripeSettings(settings: StripeSettings) {
  localStorage.setItem(STRIPE_SETTINGS_KEY, JSON.stringify(settings));
  // Notify all other mounted instances of this hook in the same tab
  window.dispatchEvent(new CustomEvent(STRIPE_SETTINGS_EVENT));
}

export function useStripeSettings() {
  const [settings, setSettings] = useState<StripeSettings>(loadStripeSettings);

  // Re-read whenever another instance saves (same tab)
  useEffect(() => {
    const handler = () => setSettings(loadStripeSettings());
    window.addEventListener(STRIPE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(STRIPE_SETTINGS_EVENT, handler);
  }, []);

  // Also sync across browser tabs via native storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STRIPE_SETTINGS_KEY) {
        setSettings(loadStripeSettings());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const updateSettings = useCallback((updates: Partial<StripeSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveStripeSettings(next);
      return next;
    });
  }, []);

  const isConfigured = Boolean(
    settings.publishableKey && settings.publishableKey.startsWith('pk_')
  );

  return {
    settings,
    updateSettings,
    isConfigured,
  };
}

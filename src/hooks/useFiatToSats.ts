import { useQuery } from '@tanstack/react-query';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'CAD', 'AUD', 'JPY', 'CHF'];

export function useFiatToSats(price: number, currency: string) {
  const normalizedCurrency = currency?.toUpperCase() || 'USD';

  return useQuery({
    // Include BOTH price AND currency in the key so each unique price+currency pair
    // gets its own cache entry — this was the main bug causing wrong sats for all products.
    queryKey: ['fiat-to-sats', normalizedCurrency, price],
    queryFn: async ({ signal }) => {
      if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
        return null;
      }

      if (price <= 0) {
        return null;
      }

      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${normalizedCurrency.toLowerCase()}`;
        const response = await fetch(
          CORS_PROXY + encodeURIComponent(url),
          { signal }
        );

        if (!response.ok) {
          throw new Error(`CoinGecko responded ${response.status}`);
        }

        const data = await response.json();
        const btcPrice = data?.bitcoin?.[normalizedCurrency.toLowerCase()];

        if (btcPrice && btcPrice > 0) {
          const priceInBTC = price / btcPrice;
          const priceInSats = Math.round(priceInBTC * 100_000_000);
          return priceInSats;
        }

        return null;
      } catch (error) {
        console.warn('useFiatToSats: conversion failed:', error);
        return null;
      }
    },
    enabled: price > 0 && SUPPORTED_CURRENCIES.includes(normalizedCurrency),
    staleTime: 5 * 60 * 1000,   // 5 minutes — BTC price is "fresh enough"
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
}

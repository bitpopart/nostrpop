import { useQuery } from '@tanstack/react-query';

export function useFiatToSats(price: number, currency: string) {
  return useQuery({
    queryKey: ['fiat-to-sats', currency],
    queryFn: async ({ signal }) => {
      // Only convert fiat currencies
      if (!['USD', 'EUR', 'GBP', 'SGD', 'CAD', 'AUD', 'JPY', 'CHF'].includes(currency)) {
        return null;
      }

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`,
          { signal }
        );
        const data = await response.json();
        const btcPrice = data?.bitcoin?.[currency.toLowerCase()];
        
        if (btcPrice && btcPrice > 0) {
          const priceInBTC = price / btcPrice;
          const priceInSats = Math.round(priceInBTC * 100000000);
          return priceInSats;
        }
        
        return null;
      } catch (error) {
        console.warn('Failed to convert to sats:', error);
        return null;
      }
    },
    enabled: price > 0 && !!currency,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

interface SiteColors {
  comingSoonFrom: string;
  comingSoonTo: string;
  primaryFrom: string;
  primaryTo: string;
  secondaryFrom: string;
  secondaryTo: string;
  accentColor: string;
  headerTextFrom: string;
  headerTextVia: string;
  headerTextTo: string;
}

const DEFAULT_COLORS: SiteColors = {
  comingSoonFrom: '#f97316',
  comingSoonTo: '#ec4899',
  primaryFrom: '#a855f7',
  primaryTo: '#ec4899',
  secondaryFrom: '#6366f1',
  secondaryTo: '#8b5cf6',
  accentColor: '#f97316',
  headerTextFrom: '#db2777',
  headerTextVia: '#a855f7',
  headerTextTo: '#6366f1',
};

const applyColorsToDOM = (colors: SiteColors) => {
  const root = document.documentElement;
  root.style.setProperty('--coming-soon-from', colors.comingSoonFrom);
  root.style.setProperty('--coming-soon-to', colors.comingSoonTo);
  root.style.setProperty('--primary-gradient-from', colors.primaryFrom);
  root.style.setProperty('--primary-gradient-to', colors.primaryTo);
  root.style.setProperty('--secondary-gradient-from', colors.secondaryFrom);
  root.style.setProperty('--secondary-gradient-to', colors.secondaryTo);
  root.style.setProperty('--accent-color', colors.accentColor);
  root.style.setProperty('--header-text-from', colors.headerTextFrom);
  root.style.setProperty('--header-text-via', colors.headerTextVia);
  root.style.setProperty('--header-text-to', colors.headerTextTo);
};

export function useThemeColors() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();
  const [colors, setColors] = useState<SiteColors>(DEFAULT_COLORS);

  // Apply default colors immediately on mount
  useEffect(() => {
    applyColorsToDOM(DEFAULT_COLORS);
  }, []);

  // Fetch site colors from Nostr
  const { data: nostrColors } = useQuery({
    queryKey: ['site-colors-public', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      try {
        const events = await nostr.query([{
          kinds: [30078],
          authors: [adminPubkey],
          '#d': ['com.bitpopart.site-colors'],
          limit: 1,
        }], { signal });

        if (events.length > 0 && events[0].content) {
          try {
            const parsed = JSON.parse(events[0].content) as SiteColors;
            console.log('[useThemeColors] Loaded colors from Nostr:', parsed);
            return parsed;
          } catch (e) {
            console.error('[useThemeColors] Failed to parse site colors from Nostr:', e);
          }
        }
      } catch (error) {
        console.error('[useThemeColors] Failed to fetch site colors:', error);
      }
      
      return DEFAULT_COLORS;
    },
    enabled: !!adminPubkey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update colors when nostr colors change or on custom event
  useEffect(() => {
    if (nostrColors) {
      setColors(nostrColors);
      applyColorsToDOM(nostrColors);
    }
  }, [nostrColors]);

  // Listen for custom events from admin settings
  useEffect(() => {
    const handleColorUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteColors>;
      if (customEvent.detail) {
        console.log('[useThemeColors] Received color update event:', customEvent.detail);
        setColors(customEvent.detail);
        applyColorsToDOM(customEvent.detail);
      }
    };

    window.addEventListener('theme-colors-updated', handleColorUpdate);
    return () => window.removeEventListener('theme-colors-updated', handleColorUpdate);
  }, []);

  const getGradientStyle = (type: 'primary' | 'secondary' | 'coming-soon' | 'header-text') => {
    switch (type) {
      case 'primary':
        return {
          background: `linear-gradient(to right, ${colors.primaryFrom}, ${colors.primaryTo})`,
        };
      case 'secondary':
        return {
          background: `linear-gradient(to right, ${colors.secondaryFrom}, ${colors.secondaryTo})`,
        };
      case 'coming-soon':
        return {
          background: `linear-gradient(to right, ${colors.comingSoonFrom}, ${colors.comingSoonTo})`,
        };
      case 'header-text':
        return {
          background: `linear-gradient(to right, ${colors.headerTextFrom}, ${colors.headerTextVia}, ${colors.headerTextTo})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        };
    }
  };

  const getGradientClass = (type: 'primary' | 'secondary' | 'coming-soon' | 'header-text') => {
    // Return inline style instead of class for dynamic colors
    return getGradientStyle(type);
  };

  return {
    colors,
    getGradientStyle,
    getGradientClass,
  };
}

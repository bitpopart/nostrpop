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
  pageBackground?: string;
  bodyText?: string;
  buttonText?: string;
  headingText?: string;
  iconColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
}

const DEFAULT_COLORS: SiteColors = {
  comingSoonFrom: '#e99840',
  comingSoonTo: '#e99840',
  primaryFrom: '#e99840',
  primaryTo: '#e99840',
  secondaryFrom: '#e99840',
  secondaryTo: '#e99840',
  accentColor: '#e99840',
  headerTextFrom: '#e99840',
  headerTextVia: '#e99840',
  headerTextTo: '#e99840',
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
  
  // Apply optional color properties
  if (colors.pageBackground) root.style.setProperty('--page-background', colors.pageBackground);
  if (colors.bodyText) root.style.setProperty('--body-text-color', colors.bodyText);
  if (colors.buttonText) root.style.setProperty('--button-text-color', colors.buttonText);
  if (colors.headingText) root.style.setProperty('--heading-text-color', colors.headingText);
  if (colors.iconColor) root.style.setProperty('--icon-color', colors.iconColor);
  if (colors.linkColor) root.style.setProperty('--link-color', colors.linkColor);
  if (colors.linkHoverColor) root.style.setProperty('--link-hover-color', colors.linkHoverColor);
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
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text' as any,
          color: 'transparent',
          display: 'inline-block',
        } as React.CSSProperties;
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

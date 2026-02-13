import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

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

export function useThemeColors() {
  const [siteColors] = useLocalStorage<SiteColors>('site-colors', DEFAULT_COLORS);
  const [colors, setColors] = useState<SiteColors>(siteColors);

  useEffect(() => {
    setColors(siteColors);
  }, [siteColors]);

  useEffect(() => {
    const handleColorUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteColors>;
      if (customEvent.detail) {
        setColors(customEvent.detail);
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

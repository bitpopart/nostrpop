import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Component that loads and applies site theme colors from Nostr.
 * This component doesn't render anything visible - it just ensures
 * that theme colors are fetched and applied to the DOM for all visitors.
 */
export function ThemeColorLoader() {
  // This hook fetches colors from Nostr and applies them to the DOM
  useThemeColors();
  
  // This component doesn't render anything
  return null;
}

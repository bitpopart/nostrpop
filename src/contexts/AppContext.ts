import { createContext } from "react";

export type Theme = "dark" | "light" | "system";

export interface AppConfig {
  /** Current theme */
  theme: Theme;
  /** Selected relay URL */
  relayUrl: string;
  /** Image proxy base URL for thumbnails in lists/grids. Reduces bandwidth and
   *  speeds up image loading. Empty string = disabled (load originals directly).
   *  Any URL = proxy thumbnails through that host (must support the wsrv.nl /
   *  weserv images API). Default public instance: 'https://wsrv.nl'. */
  imageProxy: string;
}

export interface PresetRelay {
  name: string;
  url: string;
  /** Query this relay for reads. Defaults to true when omitted. */
  read?: boolean;
  /** Publish events to this relay. Defaults to true when omitted. */
  write?: boolean;
}

export interface AppContextType {
  /** Current application configuration */
  config: AppConfig;
  /** Update configuration using a callback that receives current config and returns new config */
  updateConfig: (updater: (currentConfig: AppConfig) => AppConfig) => void;
  /** Optional list of preset relays to display in the RelaySelector */
  presetRelays?: PresetRelay[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

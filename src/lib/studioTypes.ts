// Studio library types for Pop Art Studio

export interface StudioImage {
  url: string;
  name: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface StudioLibrary {
  id: string;           // d-tag (unique identifier)
  name: string;         // Library display name
  description?: string; // Optional description
  coverImage?: string;  // Cover image URL
  images: StudioImage[];
  pubkey: string;
  createdAt: number;
}

// Canvas format presets
export interface CanvasFormat {
  id: string;
  name: string;
  label: string;
  width: number;   // in pixels (96 DPI for screen, 300 DPI for print)
  height: number;
  dpi?: number;
  category: 'print' | 'digital';
  icon?: string;
}

export const CANVAS_FORMATS: CanvasFormat[] = [
  // Print formats
  {
    id: 'sticker',
    name: 'Sticker',
    label: 'Sticker (10×10 cm)',
    width: 1181,
    height: 1181,
    dpi: 300,
    category: 'print',
  },
  {
    id: 'flyer-a5',
    name: 'Flyer A5',
    label: 'Flyer A5 (148×210 mm)',
    width: 1748,
    height: 2480,
    dpi: 300,
    category: 'print',
  },
  {
    id: 'flyer-a4',
    name: 'Flyer A4',
    label: 'Flyer A4 (210×297 mm)',
    width: 2480,
    height: 3508,
    dpi: 300,
    category: 'print',
  },
  // Digital formats
  {
    id: 'banner',
    name: 'Banner',
    label: 'Banner / Header (1200×400)',
    width: 1200,
    height: 400,
    category: 'digital',
  },
  {
    id: 'avatar',
    name: 'Avatar',
    label: 'Avatar (500×500)',
    width: 500,
    height: 500,
    category: 'digital',
  },
  {
    id: 'square',
    name: 'Square Post',
    label: 'Square Post (1080×1080)',
    width: 1080,
    height: 1080,
    category: 'digital',
  },
];

// Nostr event kind for studio libraries (addressable)
// Using kind 30078 (app-specific data) with a specific d-tag prefix
export const STUDIO_LIBRARY_KIND = 30078;
export const STUDIO_LIBRARY_D_PREFIX = 'popart-studio-library:';

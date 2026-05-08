export type PopUpType = 'art' | 'shop' | 'event';
export type PopUpStatus = 'confirmed' | 'option';

export interface PopUpEventData {
  id: string;
  title: string;
  description: string;
  type: PopUpType;
  status: PopUpStatus;
  location: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate?: string;
  image?: string;
  galleryImages?: string[];
  link?: string;
  brandSite?: string;
  event?: {
    id: string;
    kind: number;
    pubkey: string;
  };
  isFinished?: boolean;
}

export const POPUP_TYPE_CONFIG = {
  art: { label: 'Art', icon: '🎨', bgColor: 'bg-pink-100', color: 'text-pink-700' },
  shop: { label: 'Shop', icon: '🛍️', bgColor: 'bg-blue-100', color: 'text-blue-700' },
  event: { label: 'Event', icon: '📅', bgColor: 'bg-green-100', color: 'text-green-700' },
} as const;

export const POPUP_STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', bgColor: 'bg-green-100', color: 'text-green-700' },
  option: { label: 'Option', bgColor: 'bg-yellow-100', color: 'text-yellow-700' },
} as const;

export function coordinatesToGeohash(lat: number, lon: number) {
  return `${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

export function generateUUID() {
  return crypto.randomUUID();
}

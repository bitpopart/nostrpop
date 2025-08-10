import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface CardCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isDefault: boolean;
  isVisible: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES: CardCategory[] = [
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Celebrate special birthdays with joy and happiness',
    color: '#FF6B6B',
    icon: '🎂',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    description: 'Commemorate special milestones and anniversaries',
    color: '#4ECDC4',
    icon: '💕',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'holiday',
    name: 'Holiday',
    description: 'Seasonal greetings and holiday celebrations',
    color: '#45B7D1',
    icon: '🎄',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    description: 'Express gratitude and appreciation',
    color: '#96CEB4',
    icon: '🙏',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'congratulations',
    name: 'Congratulations',
    description: 'Celebrate achievements and successes',
    color: '#FFEAA7',
    icon: '🎉',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'get-well',
    name: 'Get Well',
    description: 'Send healing thoughts and well wishes',
    color: '#DDA0DD',
    icon: '🌸',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'love',
    name: 'Love',
    description: 'Express love and romantic feelings',
    color: '#FF69B4',
    icon: '❤️',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'friendship',
    name: 'Friendship',
    description: 'Celebrate friendship and companionship',
    color: '#87CEEB',
    icon: '👫',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sympathy',
    name: 'Sympathy',
    description: 'Offer comfort and condolences',
    color: '#B0C4DE',
    icon: '🕊️',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional and corporate communications',
    color: '#708090',
    icon: '💼',
    isDefault: true,
    isVisible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useCardCategories() {
  const [categories] = useLocalStorage<CardCategory[]>('card-categories', DEFAULT_CATEGORIES);
  
  return {
    allCategories: categories,
    visibleCategories: categories.filter(cat => cat.isVisible),
    getCategoryByName: (name: string) => categories.find(cat => cat.name === name),
    getCategoryById: (id: string) => categories.find(cat => cat.id === id),
    getVisibleCategoryNames: () => categories.filter(cat => cat.isVisible).map(cat => cat.name)
  };
}
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  featured: boolean;
  createdAt: string;
}

// Default categories with some featured ones
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Gadgets, devices, and electronic accessories',
    icon: '📱',
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'art',
    name: 'Art',
    description: 'Digital art, NFTs, and creative works',
    icon: '🎨',
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'software',
    name: 'Software',
    description: 'Applications, tools, and digital products',
    icon: '💻',
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Fashion and apparel',
    icon: '👕',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'shoes',
    name: 'Shoes',
    description: 'Footwear and accessories',
    icon: '👟',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Accessories and precious items',
    icon: '💎',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Various accessories and add-ons',
    icon: '👜',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Digital and physical books',
    icon: '📚',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Audio files, albums, and music content',
    icon: '🎵',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Video games and gaming content',
    icon: '🎮',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'food',
    name: 'Food',
    description: 'Food products and recipes',
    icon: '🍕',
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Miscellaneous products',
    icon: '📦',
    featured: false,
    createdAt: new Date().toISOString()
  }
];

// Local storage key for categories
export const CATEGORIES_STORAGE_KEY = 'bitpop-marketplace-categories';

// Helper functions for category management
export function getStoredCategories(): ProductCategory[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) {
      const categories = JSON.parse(stored);
      // Ensure we have at least the default categories
      if (categories.length === 0) {
        return DEFAULT_CATEGORIES;
      }
      return categories;
    }
  } catch (error) {
    console.error('Error loading categories from storage:', error);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: ProductCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories to storage:', error);
  }
}

export function getFeaturedCategories(): ProductCategory[] {
  return getStoredCategories().filter(cat => cat.featured).slice(0, 3);
}

export function getAllCategoryNames(): string[] {
  return getStoredCategories().map(cat => cat.name);
}

export function getCategoryByName(name: string): ProductCategory | undefined {
  return getStoredCategories().find(cat => cat.name === name);
}

export function generateCategoryId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
// Marketplace categories configuration

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ProductCategory extends Category {
  featured?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: 'art',
    name: 'Art',
    description: 'Artwork and prints',
    icon: '🎨'
  },
  {
    id: 'tshirts',
    name: 'T-shirts',
    description: 'Apparel and clothing',
    icon: '👕'
  },
  {
    id: 'buttons',
    name: 'Buttons',
    description: 'Pin buttons and badges',
    icon: '🔵'
  },
  {
    id: 'stickers',
    name: 'Stickers',
    description: 'Stickers and decals',
    icon: '🏷️'
  },
  {
    id: 'keychains',
    name: 'Keychains',
    description: 'Accessories and keychains',
    icon: '🔑'
  },
  {
    id: 'digital',
    name: 'Digital Downloads',
    description: 'Digital products and downloads',
    icon: '💾'
  }
];

// Get all category names
export function getCategoryNames(): string[] {
  return CATEGORIES.map(cat => cat.name);
}

// Get category by name
export function getCategoryByName(name: string): Category | undefined {
  return CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
}

// Get category by id
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

// Add a new category (admin function)
export function addCategory(category: Category): Category[] {
  // Check if category already exists
  const exists = CATEGORIES.find(cat => cat.id === category.id || cat.name === category.name);
  if (exists) {
    throw new Error('Category already exists');
  }
  
  CATEGORIES.push(category);
  return CATEGORIES;
}

// Remove a category (admin function)
export function removeCategory(categoryId: string): Category[] {
  const index = CATEGORIES.findIndex(cat => cat.id === categoryId);
  if (index === -1) {
    throw new Error('Category not found');
  }
  
  CATEGORIES.splice(index, 1);
  return CATEGORIES;
}

// Get all categories
export function getAllCategories(): Category[] {
  return CATEGORIES;
}

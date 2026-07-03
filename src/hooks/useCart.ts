import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  discount?: number;
  images: string[];
  type: 'physical' | 'digital';
  category: string;
  quantity: number;
}

export interface CartAddress {
  name: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const CART_KEY = 'nostrpop_cart';
const ADDRESS_KEY = 'nostrpop_cart_address';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function loadAddress(): CartAddress {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    return raw ? JSON.parse(raw) : emptyAddress();
  } catch {
    return emptyAddress();
  }
}

function emptyAddress(): CartAddress {
  return { name: '', email: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: '' };
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [address, setAddress] = useState<CartAddress>(loadAddress);

  // Persist to localStorage whenever items change
  useEffect(() => {
    saveCart(items);
    // Broadcast to other components
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
  }, [address]);

  // Listen for cart updates from other instances
  useEffect(() => {
    const handler = () => setItems(loadCart());
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const updateAddress = useCallback((fields: Partial<CartAddress>) => {
    setAddress(prev => ({ ...prev, ...fields }));
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    const effectivePrice = i.discount && i.discount > 0
      ? i.price * (1 - i.discount / 100)
      : i.price;
    return sum + effectivePrice * i.quantity;
  }, 0);

  const currency = items[0]?.currency || 'USD';

  return {
    items,
    address,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    updateAddress,
    totalItems,
    subtotal,
    currency,
  };
}

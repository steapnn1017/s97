import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface CartItem {
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    translations?: Record<string, { name: string; description: string }>;
  };
}

interface CartState {
  sessionId: string;
  items: CartItem[];
  total: number;
  isLoading: boolean;
  initialized: boolean;
  initializeCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, size: string, color: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
}

const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useCartStore = create<CartState>((set, get) => ({
  sessionId: '',
  items: [],
  total: 0,
  isLoading: false,
  initialized: false,

  initializeCart: async () => {
    try {
      let sessionId = await AsyncStorage.getItem('cart_session_id');
      if (!sessionId) {
        sessionId = generateSessionId();
        await AsyncStorage.setItem('cart_session_id', sessionId);
      }
      set({ sessionId, initialized: true });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to initialize cart:', error);
      const sessionId = generateSessionId();
      set({ sessionId, initialized: true });
    }
  },

  fetchCart: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/api/cart/${sessionId}`);
      const data = await response.json();
      set({ 
        items: data.items || [], 
        total: data.total || 0,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (newItem: CartItem) => {
    const { sessionId, items } = get();
    if (!sessionId) return;

    // Check if item already exists
    const existingIndex = items.findIndex(
      item => item.product_id === newItem.product_id && 
              item.size === newItem.size && 
              item.color === newItem.color
    );

    let updatedItems: CartItem[];
    if (existingIndex >= 0) {
      updatedItems = items.map((item, index) => 
        index === existingIndex 
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      );
    } else {
      updatedItems = [...items, newItem];
    }

    // Send to API
    try {
      const response = await fetch(`${API_URL}/api/cart/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: updatedItems.map(({ product_id, quantity, size, color }) => ({
            product_id, quantity, size, color
          }))
        }),
      });
      const data = await response.json();
      set({ items: data.items || [], total: data.total || 0 });
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  },

  updateQuantity: async (productId: string, size: string, color: string, quantity: number) => {
    const { sessionId, items } = get();
    if (!sessionId) return;

    const updatedItems = items.map(item => 
      (item.product_id === productId && item.size === size && item.color === color)
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    );

    try {
      const response = await fetch(`${API_URL}/api/cart/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: updatedItems.map(({ product_id, quantity, size, color }) => ({
            product_id, quantity, size, color
          }))
        }),
      });
      const data = await response.json();
      set({ items: data.items || [], total: data.total || 0 });
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  },

  removeItem: async (productId: string, size: string, color: string) => {
    const { sessionId, items } = get();
    if (!sessionId) return;

    const updatedItems = items.filter(item => 
      !(item.product_id === productId && item.size === size && item.color === color)
    );

    try {
      const response = await fetch(`${API_URL}/api/cart/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: updatedItems.map(({ product_id, quantity, size, color }) => ({
            product_id, quantity, size, color
          }))
        }),
      });
      const data = await response.json();
      set({ items: data.items || [], total: data.total || 0 });
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  },

  clearCart: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      await fetch(`${API_URL}/api/cart/${sessionId}`, {
        method: 'DELETE',
      });
      set({ items: [], total: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

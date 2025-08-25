import { create } from 'zustand';
import { type Item } from '../db/db';

export interface CartItem extends Item {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  customer: string | null;
  addItem: (item: Item) => void;
  removeItem: (itemName: string) => void;
  updateQuantity: (itemName: string, quantity: number) => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
  totalItems: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,

  addItem: (itemToAdd) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.name === itemToAdd.name);
    if (existingItem) {
      const updatedItems = currentItems.map((item) =>
        item.name === itemToAdd.name
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      set({ items: updatedItems });
    } else {
      set({ items: [...currentItems, { ...itemToAdd, quantity: 1 }] });
    }
  },

  removeItem: (itemName) => {
    set((state) => ({
      items: state.items.filter((item) => item.name !== itemName),
    }));
  },

  updateQuantity: (itemName, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemName);
    } else {
      set((state) => ({
        items: state.items.map((item) =>
          item.name === itemName ? { ...item, quantity } : item
        ),
      }));
    }
  },

  setCustomer: (customerId) => {
    set({ customer: customerId });
  },

  clearCart: () => set({ items: [], customer: null }),

  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

  grandTotal: () => {
    const total = get().items.reduce((total, item) => {
      const price = item.standard_rate || 0;
      return total + (price * item.quantity);
    }, 0);
    return parseFloat(total.toFixed(2));
  },
}));

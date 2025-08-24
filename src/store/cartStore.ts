import { create } from 'zustand';
import { type Item } from '../db/db';

// Define the structure of an item when it's in the cart
export interface CartItem extends Item {
  quantity: number;
}

// Define the shape of the store's state and actions
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

  // Adds an item to the cart. If the item already exists, it increments the quantity.
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

  // Removes an item from the cart entirely, regardless of quantity.
  removeItem: (itemName) => {
    set((state) => ({
      items: state.items.filter((item) => item.name !== itemName),
    }));
  },

  // Updates a specific item's quantity. Removes the item if quantity is 0 or less.
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

  // Action to set the customer for the transaction
  setCustomer: (customerId) => {
    set({ customer: customerId });
  },

  // Clears all items from the cart and resets the customer.
  clearCart: () => set({ items: [], customer: null }),

  // Calculates the total number of items in the cart (e.g., 2 apples + 3 oranges = 5).
  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

  // Calculates the total price of all items in the cart.
  grandTotal: () => {
    const total = get().items.reduce((total, item) => {
      const price = item.standard_rate || 0;
      return total + (price * item.quantity);
    }, 0);
    // Return a fixed 2-decimal string for currency representation
    return parseFloat(total.toFixed(2));
  },
}));

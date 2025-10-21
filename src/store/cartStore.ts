import { create } from 'zustand';
import { type Item, type Customer } from '../services/apiService';

export interface CartItem extends Item {
  quantity: number;
  itemDiscountType?: DiscountType;
  itemDiscountValue?: number;
}

export type DiscountType = 'Percentage' | 'Amount';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  additionalDiscountType: DiscountType;
  additionalDiscountValue: number;
  addItem: (item: Item) => void;
  removeItem: (itemName: string) => void;
  updateQuantity: (itemName: string, quantity: number) => void;
  updateRate: (itemName: string, rate: number) => void;
  setItemDiscount: (itemName: string, type: DiscountType, value: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setAdditionalDiscount: (type: DiscountType, value: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subTotal: () => number;
  discountAmount: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  additionalDiscountType: 'Percentage',
  additionalDiscountValue: 0,

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

  updateRate: (itemName, rate) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.name === itemName ? { ...item, standard_rate: rate } : item
      ),
    }));
  },

  setItemDiscount: (itemName, type, value) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.name === itemName 
          ? { ...item, itemDiscountType: type, itemDiscountValue: value } 
          : item
      ),
    }));
  },

  setCustomer: (customer) => {
    set({ customer });
  },

  setAdditionalDiscount: (type, value) => {
    set({ additionalDiscountType: type, additionalDiscountValue: value });
  },

  clearCart: () => set({
    items: [],
    customer: null,
    additionalDiscountType: 'Percentage',
    additionalDiscountValue: 0
  }),

  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

  subTotal: () => {
    return get().items.reduce((total, item) => {
      const price = item.standard_rate || 0;
      const itemTotal = price * item.quantity;
      
      // Apply item-level discount
      if (item.itemDiscountType && item.itemDiscountValue) {
        let discount = 0;
        if (item.itemDiscountType === 'Percentage') {
          discount = (itemTotal * item.itemDiscountValue) / 100;
        } else {
          discount = item.itemDiscountValue;
        }
        return total + (itemTotal - discount);
      }
      
      return total + itemTotal;
    }, 0);
  },

  discountAmount: () => {
    const { additionalDiscountType, additionalDiscountValue, subTotal } = get();
    const sub = subTotal();
    if (additionalDiscountType === 'Percentage') {
      return (sub * additionalDiscountValue) / 100;
    }
    return additionalDiscountValue;
  },

  grandTotal: () => {
    const { subTotal, discountAmount } = get();
    const total = subTotal() - discountAmount();
    return parseFloat(total.toFixed(2));
  },
}));

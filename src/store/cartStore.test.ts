import { useCartStore } from './cartStore';
import { act } from '@testing-library/react';
import { type Item } from '../db/db';

// Mock item data for testing purposes
const mockItem1: Item = { name: 'ITEM001', item_name: 'Test Item 1', standard_rate: 10, item_group: 'Test', stock_uom: 'Nos' };
const mockItem2: Item = { name: 'ITEM002', item_name: 'Test Item 2', standard_rate: 25, item_group: 'Test', stock_uom: 'Nos' };

describe('useCartStore', () => {
  // Reset the store's state to a clean slate before each test runs
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  it('should have an initial state with an empty items array', () => {
    const { items } = useCartStore.getState();
    expect(items).toEqual([]);
  });

  it('should add a new item to the cart with quantity 1', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ ...mockItem1, quantity: 1 });
  });

  it('should increment the quantity of an existing item instead of adding a duplicate', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().addItem(mockItem1);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should remove an item from the cart by its name', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().addItem(mockItem2);
      useCartStore.getState().removeItem(mockItem1.name);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe(mockItem2.name);
  });

  it('should update the quantity of a specific item', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().updateQuantity(mockItem1.name, 5);
    });
    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(5);
  });

  it('should remove an item if its quantity is updated to 0', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().updateQuantity(mockItem1.name, 0);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it('should remove an item if its quantity is updated to a negative number', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().updateQuantity(mockItem1.name, -1);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it('should clear the entire cart of all items', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().addItem(mockItem2);
      useCartStore.getState().clearCart();
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it('should calculate the total number of items correctly (sum of quantities)', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1); // quantity becomes 1
      useCartStore.getState().addItem(mockItem1); // quantity becomes 2
      useCartStore.getState().addItem(mockItem2); // quantity becomes 1
    });
    const { totalItems } = useCartStore.getState();
    expect(totalItems()).toBe(3); // 2 + 1
  });

  it('should calculate the grand total price correctly', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1); // 1 * 10 = 10
      useCartStore.getState().addItem(mockItem1); // 2 * 10 = 20
      useCartStore.getState().addItem(mockItem2); // 1 * 25 = 25
    });
    const { grandTotal } = useCartStore.getState();
    // Total should be (2 * 10) + (1 * 25) = 45
    expect(grandTotal()).toBe(45);
  });
});

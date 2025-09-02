import { useCartStore } from './cartStore';
import { act } from '@testing-library/react';
import { type Item, type Customer } from '../db/db';

const mockItem1: Item = { name: 'ITEM001', item_name: 'Test Item 1', standard_rate: 10, item_group: 'Test', stock_uom: 'Nos' };
const mockItem2: Item = { name: 'ITEM002', item_name: 'Test Item 2', standard_rate: 25, item_group: 'Test', stock_uom: 'Nos' };
const mockCustomer: Customer = { name: 'CUST-0001', customer_name: 'Test Customer', customer_group: 'Test Group' };

describe('useCartStore', () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  it('should add a new item to the cart', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ ...mockItem1, quantity: 1 });
  });

  it('should increment the quantity of an existing item', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().addItem(mockItem1);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should remove an item from the cart', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().addItem(mockItem2);
      useCartStore.getState().removeItem(mockItem1.name);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe(mockItem2.name);
  });

  it('should update the quantity of an item', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().updateQuantity(mockItem1.name, 5);
    });
    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(5);
  });

  it('should remove an item if quantity is updated to 0', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1);
      useCartStore.getState().updateQuantity(mockItem1.name, 0);
    });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it('should set and clear a customer', () => {
    act(() => {
      useCartStore.getState().setCustomer(mockCustomer);
    });
    expect(useCartStore.getState().customer).toEqual(mockCustomer);

    act(() => {
      useCartStore.getState().clearCart();
    });
    expect(useCartStore.getState().customer).toBeNull();
  });

  it('should calculate the grand total correctly', () => {
    act(() => {
      useCartStore.getState().addItem(mockItem1); // 10
      useCartStore.getState().addItem(mockItem1); // 20
      useCartStore.getState().addItem(mockItem2); // 25
    });
    const { grandTotal } = useCartStore.getState();
    expect(grandTotal()).toBe(45);
  });
});

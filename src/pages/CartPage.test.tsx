import { render, screen, cleanup } from '../test/test-utils';
import { CartPage } from './CartPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { vi } from 'vitest';
import { type CartItem } from '../store/cartStore';
import { type Customer } from '../db/db';

vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');

const mockCartItems: CartItem[] = [
  { name: 'ITEM001', item_name: 'Apple', standard_rate: 1.5, quantity: 2, item_group: 'Fruit', stock_uom: 'Nos' },
];

describe('CartPage', () => {
  const setupMocks = (items: CartItem[], customer: Partial<Customer> | null) => {
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = {
        items,
        customer,
        grandTotal: () => items.reduce((acc, item) => acc + (item.standard_rate || 0) * item.quantity, 0),
        // Mock other actions if needed by the component
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        setCustomer: vi.fn(),
      };
      return selector(state);
    });
    (useSettingsStore as any).mockImplementation((selector: any) => selector({ currency: 'USD' }));
  };

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('should display an "empty cart" message if there are no items', () => {
    setupMocks([], null);
    render(<CartPage />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('should render the items in the cart', () => {
    setupMocks(mockCartItems, { name: 'CUST-0001', customer_name: 'Test Customer' });
    render(<CartPage />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    // Use a more specific query to target the grand total
    expect(screen.getByRole('heading', { level: 2, name: /usd 3.00/i })).toBeInTheDocument();
  });

  it('should render the customer selection UI when no customer is selected', () => {
    setupMocks(mockCartItems, null); // No customer selected
    render(<CartPage />);
    expect(screen.getByText('No customer selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select customer/i })).toBeInTheDocument();
  });

  it('should display the customer name when a customer is selected', () => {
    const customer = { name: 'CUST-0001', customer_name: 'Test Customer' };
    setupMocks(mockCartItems, customer);
    render(<CartPage />);
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.queryByText('CUST-0001')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change customer/i })).toBeInTheDocument();
  });
});

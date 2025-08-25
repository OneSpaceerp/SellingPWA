import { render, screen, cleanup } from '@testing-library/react';
import { CartPage } from './CartPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { type CartItem } from '../store/cartStore';

vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');

const mockCartItems: CartItem[] = [
  { name: 'ITEM001', item_name: 'Apple', standard_rate: 1.5, quantity: 2, item_group: 'Fruit', stock_uom: 'Nos' },
];

describe('CartPage', () => {
  const setupMocks = (items: CartItem[], customer: string | null) => {
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

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <MantineProvider>
          <CartPage />
        </MantineProvider>
      </BrowserRouter>
    );
  };

  it('should display an "empty cart" message if there are no items', () => {
    setupMocks([], null);
    renderComponent();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('should render the items in the cart', () => {
    setupMocks(mockCartItems, 'CUST-0001');
    renderComponent();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('USD 3.00')).toBeInTheDocument(); // 1.5 * 2
  });

  it('should render the customer selection UI', () => {
    setupMocks(mockCartItems, null); // No customer selected
    renderComponent();
    expect(screen.getByText('No customer selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select customer/i })).toBeInTheDocument();
  });
});

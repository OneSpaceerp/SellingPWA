import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CartPage } from './CartPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { type CartItem } from '../store/cartStore';

// Mock the store dependencies
vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');

// Mock data representing items in the cart
const mockCartItems: CartItem[] = [
  { name: 'ITEM001', item_name: 'Apple', standard_rate: 1.5, quantity: 2, item_group: 'Fruit', stock_uom: 'Nos' },
  { name: 'ITEM002', item_name: 'Banana', standard_rate: 2, quantity: 3, item_group: 'Fruit', stock_uom: 'Nos' },
];

describe('CartPage', () => {
  let mockUpdateQuantity: () => void;
  let mockRemoveItem: () => void;
  let mockClearCart: () => void;
  let mockGrandTotal: () => number;

  // Helper function to render the component with necessary providers
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <MantineProvider>
          <CartPage />
        </MantineProvider>
      </BrowserRouter>
    );
  };

  // Set up the default mock implementation before each test
  beforeEach(() => {
    mockUpdateQuantity = vi.fn();
    mockRemoveItem = vi.fn();
    mockClearCart = vi.fn();
    // (1.5 * 2) + (2 * 3) = 3 + 6 = 9
    mockGrandTotal = vi.fn(() => 9);

    // This mock now correctly handles calls with or without a selector
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = {
        items: mockCartItems,
        updateQuantity: mockUpdateQuantity,
        removeItem: mockRemoveItem,
        clearCart: mockClearCart,
        grandTotal: mockGrandTotal,
      };
      return selector ? selector(state) : state;
    });

    (useSettingsStore as any).mockImplementation((selector: any) => {
      const state = { currency: 'EGP' };
      return selector ? selector(state) : state;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('should render the list of items currently in the cart', () => {
    renderComponent();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('should display the correct grand total from the store', () => {
    renderComponent();
    // Check for the grand total, formatted with the mocked currency
    expect(screen.getByText('EGP 9.00')).toBeInTheDocument();
  });

  it('should call updateQuantity when a user changes the value in a NumberInput', () => {
    renderComponent();
    // Mantine's NumberInput renders a standard textbox role
    const quantityInputs = screen.getAllByRole('textbox');
    // Change the quantity for the first item ("Apple")
    fireEvent.change(quantityInputs[0], { target: { value: '5' } });

    expect(mockUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('ITEM001', 5);
  });

  it('should call removeItem when the user clicks the trash icon button', () => {
    renderComponent();
    // We added an aria-label to the ActionIcon to make it accessible
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    // Click the remove button for the first item ("Apple")
    fireEvent.click(removeButtons[0]);

    expect(mockRemoveItem).toHaveBeenCalledTimes(1);
    expect(mockRemoveItem).toHaveBeenCalledWith('ITEM001');
  });

  it('should display an "empty cart" message if there are no items', () => {
    // Override the mock for this specific test
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = { items: [], customer: null };
      return selector ? selector(state) : state;
    });
    renderComponent();
    // Match the full text content of the component
    expect(screen.getByText('Your cart is empty. Add items from the Catalog.')).toBeInTheDocument();
  });

  it('should render the customer selection UI', () => {
    // Use a specific mock for this test to ensure customer is null initially
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = {
        items: mockCartItems,
        customer: null,
        grandTotal: () => 99, // Add the missing function to the mock
        // ... other functions can be mocked if needed by child components
      };
      return selector ? selector(state) : state;
    });
    renderComponent();
    expect(screen.getByText('No customer selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select customer/i })).toBeInTheDocument();
  });
});

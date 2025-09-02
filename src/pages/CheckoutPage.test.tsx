import { render, screen, waitFor, cleanup } from '../test/test-utils';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { notifications } from '@mantine/notifications';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { type Customer } from '../db/db';

// Mock all dependencies
vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');
vi.mock('../services/apiService');
vi.mock('../services/authService');
vi.mock('@mantine/notifications', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    notifications: { show: vi.fn() },
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

describe('CheckoutPage', () => {
  const setupMocks = (customer: Partial<Customer> | null = { name: 'CUST-0001', customer_name: 'Test Customer' }) => {
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = {
        items: [{ name: 'ITEM001', quantity: 2, standard_rate: 50 }],
        customer,
        grandTotal: () => 100,
        subTotal: () => 100,
        discountAmount: () => 0,
        additionalDiscountType: 'Percentage',
        additionalDiscountValue: 0,
        setAdditionalDiscount: vi.fn(),
        clearCart: vi.fn(),
      };
      return selector ? selector(state) : state;
    });
    (useSettingsStore as any).mockImplementation((selector: any) => {
      const state = {
        currency: 'USD',
        posProfile: {
          company: 'Test Inc',
          warehouse: 'Stores - TI',
          warehouses: [{ warehouse: 'Stores - TI' }],
          payments: [{ mode_of_payment: 'Cash' }],
        },
      };
      return selector ? selector(state) : state;
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
    (authService.getLoggedInUser as vi.Mock).mockReturnValue('test-user');
  });

  afterEach(() => cleanup());

  it('renders summary correctly', () => {
    render(<CheckoutPage />);
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByTestId('grand-total')).toHaveTextContent('USD 100.00');
  });

  it('creates a draft sales order', async () => {
    const user = userEvent.setup();
    (apiService.createSalesOrder as any).mockResolvedValue({ name: 'SO-DRAFT-001' });
    render(<CheckoutPage />);

    await user.click(screen.getByRole('button', { name: /create sales order draft/i }));

    await waitFor(() => {
      expect(apiService.createSalesOrder).toHaveBeenCalledWith(expect.objectContaining({ docstatus: 0 }));
    });

    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Sales Order Draft Created',
      message: 'Order SO-DRAFT-001 has been successfully saved as a draft.',
    }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

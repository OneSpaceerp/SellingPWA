import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService } from '../services/apiService';
import { notifications } from '@mantine/notifications';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock all dependencies
vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');
vi.mock('../services/apiService');
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const original = await vi.importActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

describe('CheckoutPage', () => {
  const mockClearCart = vi.fn();

  // Helper function to set up the mocks for a standard test case
  const setupMocks = (customer: string | null = 'CUST-0001') => {
    // This mock now correctly handles calls with or without a selector
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = {
        items: [{ name: 'ITEM001', quantity: 2, standard_rate: 10 }],
        customer: customer,
        grandTotal: () => 20,
        clearCart: mockClearCart,
      };
      return selector ? selector(state) : state;
    });

    (useSettingsStore as any).mockImplementation((selector: any) => {
      const state = {
        currency: 'EGP',
        posProfile: {
          company: 'Test Inc',
          payments: [{ mode_of_payment: 'Cash' }, { mode_of_payment: 'Credit' }],
        },
      };
      return selector ? selector(state) : state;
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <MantineProvider>
          <CheckoutPage />
        </MantineProvider>
      </BrowserRouter>
    );
  };

  it('should render the order summary correctly', () => {
    renderComponent();
    expect(screen.getByText('Customer:')).toBeInTheDocument();
    expect(screen.getByText('CUST-0001')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('EGP 20.00')).toBeInTheDocument();
  });

  it('should render payment method options from the POS profile', () => {
    renderComponent();
    expect(screen.getByRole('radio', { name: 'Cash' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Credit' })).toBeInTheDocument();
  });

  it('should have the "Complete Payment" button disabled until a payment method is selected', () => {
    renderComponent();
    const completeButton = screen.getByRole('button', { name: 'Complete Payment' });
    expect(completeButton).toBeDisabled();

    const cashOption = screen.getByRole('radio', { name: 'Cash' });
    fireEvent.click(cashOption);

    expect(completeButton).not.toBeDisabled();
  });

  it('should call the createSalesInvoice API with the correct payload on completion', async () => {
    (apiService.createSalesInvoice as any).mockResolvedValue({ name: 'SINV-0001' });
    renderComponent();

    // Select payment method
    fireEvent.click(screen.getByRole('radio', { name: 'Cash' }));

    // Click complete
    fireEvent.click(screen.getByRole('button', { name: 'Complete Payment' }));

    await waitFor(() => {
      expect(apiService.createSalesInvoice).toHaveBeenCalledTimes(1);
      expect(apiService.createSalesInvoice).toHaveBeenCalledWith({
        customer: 'CUST-0001',
        items: [{ item_code: 'ITEM001', qty: 2, rate: 10 }],
        payments: [{ mode_of_payment: 'Cash', amount: 20 }],
        update_stock: 1,
        docstatus: 1,
        company: 'Test Inc',
        cost_center: undefined,
      });
    });
  });

  it('should show success notification, clear cart, and navigate on successful submission', async () => {
    (apiService.createSalesInvoice as any).mockResolvedValue({ name: 'SINV-0001' });
    renderComponent();
    fireEvent.click(screen.getByRole('radio', { name: 'Cash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Complete Payment' }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Success!',
        color: 'teal',
      }));
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should show an error notification on failed submission', async () => {
    (apiService.createSalesInvoice as any).mockRejectedValue(new Error('Network error'));
    renderComponent();
    fireEvent.click(screen.getByRole('radio', { name: 'Cash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Complete Payment' }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Submission Failed',
        color: 'red',
      }));
    });
  });

  it('should show an alert if no customer is selected', () => {
    setupMocks(null); // Set customer to null
    renderComponent();
    expect(screen.getByText('Customer Not Selected')).toBeInTheDocument();
  });
});

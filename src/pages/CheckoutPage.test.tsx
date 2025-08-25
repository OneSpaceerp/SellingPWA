import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService } from '../services/apiService';
import { notifications } from '@mantine/notifications';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock all dependencies
vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');
vi.mock('../services/apiService');
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

describe('CheckoutPage', () => {
  const setupMocks = (customer: string | null = 'CUST-0001') => {
    (useCartStore as any).mockImplementation((selector: any) => {
      const state = {
        items: [{ name: 'ITEM001', quantity: 2, standard_rate: 50 }],
        customer,
        grandTotal: () => 100,
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
  });

  afterEach(() => cleanup());

  const renderComponent = () => render(
    <MemoryRouter initialEntries={['/checkout']}>
      <MantineProvider>
        <Routes><Route path="/checkout" element={<CheckoutPage />} /></Routes>
      </MantineProvider>
    </MemoryRouter>
  );

  it('renders summary correctly', () => {
    renderComponent();
    expect(screen.getByText('CUST-0001')).toBeInTheDocument();
    expect(screen.getByTestId('grand-total')).toHaveTextContent('USD 100.00');
  });

  it('submits a DRAFT invoice for partial payments', async () => {
    const user = userEvent.setup();
    (apiService.createSalesInvoice as any).mockResolvedValue({ name: 'SINV-DRAFT-001' });
    renderComponent();

    await user.click(screen.getByRole('radio', { name: /cash/i }));
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /add payment/i }));
    await user.click(screen.getByRole('button', { name: /complete order/i }));

    await waitFor(() => {
      expect(apiService.createSalesInvoice).toHaveBeenCalledWith(expect.objectContaining({ docstatus: 0 }));
    });
  });

  it('submits a SUBMITTED invoice for full payments', async () => {
    const user = userEvent.setup();
    (apiService.createSalesInvoice as any).mockResolvedValue({ name: 'SINV-SUBMIT-001' });
    renderComponent();

    await user.click(screen.getByRole('radio', { name: /cash/i }));
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.click(screen.getByRole('button', { name: /add payment/i }));
    await user.click(screen.getByRole('button', { name: /complete order/i }));

    await waitFor(() => {
      expect(apiService.createSalesInvoice).toHaveBeenCalledWith(expect.objectContaining({ docstatus: 1 }));
    });
  });
});

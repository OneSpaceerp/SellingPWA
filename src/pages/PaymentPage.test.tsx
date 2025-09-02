import { render, screen, waitFor, cleanup } from '../test/test-utils';
import { PaymentPage } from './PaymentPage';
import { apiService } from '../services/apiService';
import { useSettingsStore } from '../store/settingsStore';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ orderId: 'SO-001' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('../services/apiService');
vi.mock('../store/settingsStore');

const mockOrder = {
  name: 'SO-001',
  customer: 'CUST-001',
  customer_name: 'Test Customer',
  grand_total: 200,
  outstanding_amount: 100,
};

describe('PaymentPage', () => {
  beforeEach(() => {
    (apiService.getSalesOrder as any).mockResolvedValue(mockOrder);
    (useSettingsStore as any).mockImplementation((selector: any) => {
      const state = {
        currency: 'USD',
        posProfile: {
          company: 'Test Inc',
          payments: [{ mode_of_payment: 'Cash' }],
        },
      };
      return selector ? selector(state) : state;
    });
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('should render order details and payment form', async () => {
    render(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('Collect Payment for Order SO-001')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      expect(screen.getByText(/outstanding/i)).toHaveTextContent('USD 100.00');
    });
  });

  it('should allow adding and removing payments', async () => {
    const user = userEvent.setup();
    render(<PaymentPage />);
    await waitFor(() => expect(screen.getByText(/add a payment/i)).toBeInTheDocument());

    await user.click(screen.getByRole('radio', { name: /cash/i }));
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /add payment/i }));

    expect(screen.getByText('Payments Added')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText(/50.00/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove cash payment/i }));
    expect(screen.queryByText('Payments Added')).not.toBeInTheDocument();
  });

  it('should submit payment when the button is clicked', async () => {
    const user = userEvent.setup();
    (apiService.getModeOfPaymentDetails as any).mockResolvedValue({ accounts: [{ company: 'Test Inc', default_account: 'Cash - TI' }] });
    (apiService.createPaymentEntry as any).mockResolvedValue({ name: 'PE-001' });
    (apiService.saveDoc as any).mockResolvedValue({ name: 'PE-001' });
    (apiService.submitDoc as any).mockResolvedValue({});

    render(<PaymentPage />);
    await waitFor(() => expect(screen.getByText(/add a payment/i)).toBeInTheDocument());

    await user.click(screen.getByRole('radio', { name: /cash/i }));
    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.click(screen.getByRole('button', { name: /add payment/i }));
    await user.click(screen.getByRole('button', { name: /submit payment/i }));

    await waitFor(() => {
      expect(apiService.submitDoc).toHaveBeenCalled();
    });
  });
});

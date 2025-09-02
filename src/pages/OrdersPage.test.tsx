import { render, screen, waitFor } from '../test/test-utils';
import { OrdersPage } from './OrdersPage';
import { apiService, type SalesOrder } from '../services/apiService';
import { authService } from '../services/authService';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('../services/apiService');
vi.mock('../services/authService');
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockOrders: SalesOrder[] = [
  { name: 'SO-001', docstatus: 0, customer: 'CUST-001', customer_name: 'Test Customer 1', grand_total: 100, outstanding_amount: 100, creation: new Date().toISOString(), items: [] },
  { name: 'SO-002', docstatus: 1, customer: 'CUST-002', customer_name: 'Test Customer 2', grand_total: 200, outstanding_amount: 100, creation: new Date().toISOString(), items: [] },
];

describe('OrdersPage', () => {
  beforeEach(() => {
    (apiService.getSalesOrders as vi.Mock).mockResolvedValue(mockOrders);
    (authService.getLoggedInUser as vi.Mock).mockReturnValue('test-user');
  });

  it('should display the orders with their status', async () => {
    render(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText('SO-001')).toBeInTheDocument();
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    });
    expect(screen.getByText('SO-002')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should show "Collect Payment" button for approved orders', async () => {
    const user = userEvent.setup();
    render(<OrdersPage />);

    await waitFor(() => expect(screen.getByText('SO-002')).toBeInTheDocument());
    await user.click(screen.getByText('SO-002'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collect payment/i })).toBeInTheDocument();
    });
  });
});

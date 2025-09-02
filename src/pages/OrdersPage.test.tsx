import { render, screen, waitFor, cleanup } from '../test/test-utils';
import { OrdersPage } from './OrdersPage';
import { db } from '../db/db';
import { apiService } from '../services/apiService';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { type Order } from '../db/Order';

vi.mock('../db/db');
vi.mock('../services/apiService');
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    const mockOrders: Order[] = [
      { id: 1, order_id: 'SO-001', customer: 'CUST-001', customer_name: 'Test Customer 1', status: 'Pending Approval', items: [], grand_total: 100, paid_amount: 0, outstanding_amount: 100, created_at: new Date(), created_by: 'test-user' },
      { id: 2, order_id: 'SO-002', customer: 'CUST-002', customer_name: 'Test Customer 2', status: 'Approved', items: [], grand_total: 200, paid_amount: 100, outstanding_amount: 100, created_at: new Date(), created_by: 'test-user' },
    ];
    return mockOrders;
  },
}));

const mockOrders: Order[] = [
  { id: 1, order_id: 'SO-001', customer: 'CUST-001', customer_name: 'Test Customer 1', status: 'Pending Approval', items: [], grand_total: 100, paid_amount: 0, outstanding_amount: 100, created_at: new Date(), created_by: 'test-user' },
  { id: 2, order_id: 'SO-002', customer: 'CUST-002', customer_name: 'Test Customer 2', status: 'Approved', items: [], grand_total: 200, paid_amount: 100, outstanding_amount: 100, created_at: new Date(), created_by: 'test-user' },
];

describe('OrdersPage', () => {
  beforeEach(() => {
    (db.orders.where as any).mockReturnValue({
      equals: () => ({
        toArray: vi.fn().mockResolvedValue(mockOrders),
      }),
    });
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('should display the orders with their status', () => {
    render(<OrdersPage />);
    expect(screen.getByText('SO-001')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('SO-002')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should show "Collect Payment" button for approved orders', async () => {
    const user = userEvent.setup();
    render(<OrdersPage />);

    // Click on the approved order
    await user.click(screen.getByText('SO-002'));

    // Check if the modal opens and has the button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collect payment/i })).toBeInTheDocument();
    });
  });

  it('should call the sync service when the sync button is clicked', async () => {
    const user = userEvent.setup();
    (apiService.getSalesOrders as any).mockResolvedValue([]);
    render(<OrdersPage />);

    const syncButton = screen.getByRole('button', { name: /sync with erpnext/i });
    await user.click(syncButton);

    expect(apiService.getSalesOrders).toHaveBeenCalledWith(['SO-001', 'SO-002']);
  });
});

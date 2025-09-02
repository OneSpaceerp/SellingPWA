import { render, screen, waitFor, cleanup } from '../test/test-utils';
import { OrdersPage } from './OrdersPage';
import { db } from '../db/db';
import { apiService } from '../services/apiService';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { type Order } from '../db/Order';
import { useLiveQuery } from 'dexie-react-hooks';

vi.mock('../db/db');
vi.mock('../services/apiService');
vi.mock('dexie-react-hooks');

const mockOrders: Order[] = [
  { id: 1, order_id: 'SO-001', customer: 'CUST-001', customer_name: 'Test Customer 1', status: 'Pending Approval', items: [], grand_total: 100, paid_amount: 0, outstanding_amount: 100, created_at: new Date(), created_by: 'test-user' },
  { id: 2, order_id: 'SO-002', customer: 'CUST-002', customer_name: 'Test Customer 2', status: 'Approved', items: [], grand_total: 200, paid_amount: 100, outstanding_amount: 100, created_at: new Date(), created_by: 'test-user' },
];

describe('OrdersPage', () => {
  let mockDbOrders: Order[];

  beforeEach(() => {
    mockDbOrders = [...mockOrders];
    (db.orders.where as any).mockImplementation(() => ({
      equals: () => ({
        toArray: () => Promise.resolve(mockDbOrders),
      }),
    }));
    (db.orders.delete as any).mockImplementation((id: number) => {
      mockDbOrders = mockDbOrders.filter(o => o.id !== id);
      return Promise.resolve(1);
    });
    (db.orders.update as any).mockImplementation((id: number, changes: any) => {
      mockDbOrders = mockDbOrders.map(o => o.id === id ? { ...o, ...changes } : o);
      return Promise.resolve(1);
    });
    (useLiveQuery as vi.Mock).mockImplementation(() => mockDbOrders);
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

    await user.click(screen.getByText('SO-002'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collect payment/i })).toBeInTheDocument();
    });
  });

  it('should update status when sync button is clicked', async () => {
    const user = userEvent.setup();
    (apiService.getSalesOrders as any).mockResolvedValue([{ name: 'SO-001', docstatus: 1 }]);
    render(<OrdersPage />);

    const syncButton = screen.getByRole('button', { name: /sync with erpnext/i });
    await user.click(syncButton);

    await waitFor(() => {
      expect(db.orders.update).toHaveBeenCalledWith(1, { status: 'Approved' });
    });
  });

  it('should delete orders not present in ERPNext on sync', async () => {
    const user = userEvent.setup();
    (apiService.getSalesOrders as any).mockResolvedValue([{ name: 'SO-001', docstatus: 1 }]);
    render(<OrdersPage />);

    const syncButton = screen.getByRole('button', { name: /sync with erpnext/i });
    await user.click(syncButton);

    await waitFor(() => {
      expect(db.orders.delete).toHaveBeenCalledWith(2);
    });
    expect(db.orders.update).toHaveBeenCalledWith(1, { status: 'Approved' });
  });
});

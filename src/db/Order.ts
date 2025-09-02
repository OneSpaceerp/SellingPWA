export interface Order {
  id?: number; // Optional because it's auto-incrementing
  order_id: string; // From the server
  customer: string;
  customer_name?: string;
  status: string;
  items: {
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
  }[];
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  created_at: Date;
  created_by: string; // Logged-in user
}

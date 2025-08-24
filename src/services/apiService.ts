import { authService } from './authService';
import { type PosProfileData, type Item, type Customer, type Warehouse } from '../db/db';

// The existing PosProfile type is for the list view, which is fine.
export interface PosProfile {
  name: string;
  company: string;
  currency: string;
}

// Define the structure for the Sales Invoice payload
export interface SalesInvoicePayload {
  customer: string;
  items: { item_code: string; qty: number; rate: number }[];
  payments: { mode_of_payment: string; amount: number }[];
  update_stock: 1;
  docstatus: 1; // 1 means "Submit"
  // Add other necessary fields like company, cost_center, etc. from POS Profile
  [key: string]: any;
}


/**
 * A generic GET request handler for fetching data from the ERPNext API.
 */
const get = async <T>(endpoint: string): Promise<T> => {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  if (!erpNextUrl) throw new Error('ERPNext URL not set.');

  const fullUrl = `${erpNextUrl}/api/${endpoint}`;
  const response = await fetch(fullUrl, { headers: authService.getAuthHeaders() });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API GET request to ${endpoint} failed with status ${response.status}: ${errorText}`);
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  return data.data as T;
};

/**
 * A generic POST request handler for creating documents in ERPNext.
 */
const post = async <T>(endpoint: string, payload: any): Promise<T> => {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  if (!erpNextUrl) throw new Error('ERPNext URL not set.');

  const fullUrl = `${erpNextUrl}/api/${endpoint}`;
  const headers = { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API POST request to ${endpoint} failed with status ${response.status}: ${errorText}`);
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  return data.data as T;
};


// --- Existing GET methods ---
const getPosProfiles = async (): Promise<PosProfile[]> => get<PosProfile[]>(`resource/POS Profile?fields=${encodeURIComponent('["name", "company", "currency"]')}`);
const getPosProfileDetails = async (profileName: string): Promise<PosProfileData> => get<PosProfileData>(`resource/POS Profile/${encodeURIComponent(profileName)}`);
const getItems = async (itemGroups: string[]): Promise<Item[]> => get<Item[]>(`resource/Item?fields=${encodeURIComponent('["name", "item_name", "item_group", "stock_uom", "standard_rate"]')}&filters=${encodeURIComponent(JSON.stringify([["item_group", "in", itemGroups]]))}limit_page_length=0`);
const getCustomers = async (customerGroups: string[]): Promise<Customer[]> => get<Customer[]>(`resource/Customer?fields=${encodeURIComponent('["name", "customer_name", "customer_group"]')}&filters=${encodeURIComponent(JSON.stringify([["customer_group", "in", customerGroups]]))}limit_page_length=0`);
const getWarehouses = async (warehouseNames: string[]): Promise<Warehouse[]> => get<Warehouse[]>(`resource/Warehouse?fields=${encodeURIComponent('["name", "warehouse_name", "company"]')}&filters=${encodeURIComponent(JSON.stringify([["name", "in", warehouseNames]]))}limit_page_length=0`);

// --- New POST method ---
/**
 * Creates a new Sales Invoice document in ERPNext.
 */
const createSalesInvoice = async (payload: SalesInvoicePayload): Promise<any> => {
  return post<any>('resource/Sales Invoice', payload);
};

export const apiService = {
  getPosProfiles,
  getPosProfileDetails,
  getItems,
  getCustomers,
  getWarehouses,
  createSalesInvoice,
};

import { authService } from './authService';
import { type PosProfileData, type Item, type Customer } from '../db/db';

export interface PosProfile {
  name: string;
  company: string;
  currency: string;
}

export interface SalesOrderPayload {
  customer: string;
  items: { item_code: string; qty: number; rate: number }[];
  additional_discount_percentage?: number;
  discount_amount?: number;
  update_stock: 1;
  docstatus: 0 | 1;
  hub_manager: string;
  [key: string]: any;
}

const get = async <T>(endpoint: string): Promise<T> => {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  if (!erpNextUrl) throw new Error('ERPNext URL not set.');
  const fullUrl = `${erpNextUrl}/api/${endpoint}`;
  const response = await fetch(fullUrl, { headers: authService.getAuthHeaders() });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  return data.data as T;
};

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
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  return data.data as T;
};

const getPosProfiles = async (): Promise<PosProfile[]> => get<PosProfile[]>(`resource/POS Profile?fields=${encodeURIComponent('["name", "company", "currency"]')}`);
const getPosProfileDetails = async (profileName: string): Promise<PosProfileData> => get<PosProfileData>(`resource/POS Profile/${encodeURIComponent(profileName)}`);
const getItems = async (itemGroups: string[]): Promise<Item[]> => get<Item[]>(`resource/Item?fields=${encodeURIComponent('["name", "item_name", "item_group", "stock_uom", "standard_rate"]')}&filters=${encodeURIComponent(JSON.stringify([["item_group", "in", itemGroups]]))}&limit_page_length=0`);
const getCustomers = async (customerGroups: string[]): Promise<Customer[]> => get<Customer[]>(`resource/Customer?fields=${encodeURIComponent('["name", "customer_name", "customer_group"]')}&filters=${encodeURIComponent(JSON.stringify([["customer_group", "in", customerGroups]]))}&limit_page_length=0`);
const createSalesOrder = async (payload: SalesOrderPayload): Promise<any> => post<any>('resource/Sales Order', payload);

export interface PaymentEntryPayload {
  dt: string;
  dn: string;
  party_type: string;
  party: string;
  paid_amount: number;
  paid_to: string;
  mode_of_payment: string;
  company: string;
  posting_date: string;
}

const createPaymentEntry = async (payload: PaymentEntryPayload): Promise<any> => post<any>('method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry', payload);

const getModeOfPaymentDetails = async (name: string): Promise<any> => get<any>(`resource/Mode of Payment/${encodeURIComponent(name)}`);

export const apiService = {
  getPosProfiles,
  getPosProfileDetails,
  getItems,
  getCustomers,
  createSalesOrder,
  createPaymentEntry,
  getModeOfPaymentDetails,
};

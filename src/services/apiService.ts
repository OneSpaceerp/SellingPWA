import { authService } from './authService';

export interface PosProfileData {
  name: string;
  company: string;
  currency: string;
  item_groups: { item_group: string }[];
  customer_groups: { customer_group: string }[];
  [key: string]: any;
}

export interface Item {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
}

export interface Customer {
  name: string;
  customer_name: string;
  customer_group: string;
}

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

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const get = async <T>(endpoint: string): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${endpoint}`;
  const response = await fetch(fullUrl, {
    headers: authService.getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  return data.data as T;
};

const getList = async <T>(doctype: string, filters: any, fields: string[]): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/resource/${doctype}?fields=${encodeURIComponent(JSON.stringify(fields))}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  const response = await fetch(fullUrl, {
    headers: authService.getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  return data.data as T;
}

const post = async <T>(endpoint: string, payload: any): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${endpoint}`;
  const headers = { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    credentials: 'include',
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

export interface SalesOrder {
  name: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
  outstanding_amount?: number;
  creation: string;
  items?: { item_code: string; item_name: string; qty: number; rate: number }[];
}

const getSalesOrders = async (owner: string): Promise<SalesOrder[]> => {
  const fields = [
    'name', 'docstatus', 'customer', 'customer_name',
    'grand_total', 'creation'
  ];
  const filters = [['owner', '=', owner]];
  return getList<SalesOrder[]>('Sales Order', filters, fields);
};

const getSalesOrder = async (order_id: string): Promise<any> => get<any>(`resource/Sales Order/${encodeURIComponent(order_id)}`);

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
  reference_no: string;
  reference_date: string;
}

const postMethod = async <T>(method: string, payload: any): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${method}`;
  const headers = { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  // Method calls wrap the response in a 'message' object
  return data.message as T;
};

const createPaymentEntry = async (payload: PaymentEntryPayload): Promise<any> => postMethod<any>('method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry', payload);

const getModeOfPaymentDetails = async (name: string): Promise<any> => get<any>(`resource/Mode of Payment/${encodeURIComponent(name)}`);

const saveDoc = async (doc: any): Promise<any> => {
  const doctype = encodeURIComponent(doc.doctype);
  // The 'doc' object already contains all necessary fields.
  // We just need to POST it to the resource endpoint.
  return post<any>(`resource/${doctype}`, doc);
};

const submitDoc = async (doc: any): Promise<any> => {
  // The frappe.client.submit method expects the document to be wrapped in a 'doc' object.
  return postMethod<any>('method/frappe.client.submit', { doc: doc });
};

export const apiService = {
  getPosProfiles,
  getPosProfileDetails,
  getItems,
  getCustomers,
  getSalesOrders,
  getSalesOrder,
  createSalesOrder,
  createPaymentEntry,
  getModeOfPaymentDetails,
  saveDoc,
  submitDoc,
};

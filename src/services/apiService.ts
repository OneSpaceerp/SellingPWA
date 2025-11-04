import { authService } from './authService';

export interface PosProfileData {
  name: string;
  company: string;
  currency: string;
  item_groups: { item_group: string }[];
  customer_groups: { customer_group: string }[];
  selling_price_list?: string;
  price_list?: string;
  [key: string]: any;
}

export interface Item {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  actual_qty?: number;
}

export interface Customer {
  name: string;
  customer_name: string;
  customer_group: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface Contact {
  name: string;
  first_name: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  is_primary_contact: number;
  links: {
    link_doctype: string;
    link_name: string;
  }[];
}

export interface Address {
  name: string;
  address_title: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  is_primary_address: number;
  links: {
    link_doctype: string;
    link_name: string;
  }[];
}

export interface CustomerContact {
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  is_primary_contact?: boolean;
}

export interface CustomerAddress {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  is_primary_address?: boolean;
}

export interface PosProfile {
  name: string;
  company: string;
  currency: string;
}

export interface SalesOrderPayload {
  customer: string;
  items: { 
    item_code: string; 
    qty: number; 
    rate: number;
    discount_percentage?: number;
    discount_amount?: number;
    [key: string]: any;
  }[];
  additional_discount_percentage?: number;
  discount_amount?: number;
  update_stock: 1;
  docstatus: 0 | 1;
  hub_manager: string;
  [key: string]: any;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://lcs.nsd-eg.com';
console.log('API_BASE_URL configured as:', API_BASE_URL);

const get = async <T>(endpoint: string): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${endpoint}`;
  console.log('Making GET request to:', fullUrl);
  
  // Check authentication status
  const user = authService.getLoggedInUser();
  console.log('Current user from sessionStorage:', user);
  console.log('Is authenticated:', authService.isAuthenticated());
  
  const headers = await authService.getAuthHeaders();
  console.log('Headers:', headers);
  
  const response = await fetch(fullUrl, {
    headers: headers as HeadersInit,
    credentials: 'include',
  });
  console.log('Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API request failed:', response.status, errorText);
    throw new Error(`API request failed: ${errorText}`);
  }
  const data = await response.json();
  console.log('Response data:', data);
  console.log('Extracted data.data:', data.data);
  return data.data as T;
};

const getList = async <T>(doctype: string, filters: any, fields: string[]): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/resource/${doctype}?fields=${encodeURIComponent(JSON.stringify(fields))}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  const headers = await authService.getAuthHeaders();
  const response = await fetch(fullUrl, {
    headers: headers as HeadersInit,
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
  const authHeaders = await authService.getAuthHeaders();
  const headers = { ...authHeaders, 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: headers as HeadersInit,
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

const put = async <T>(endpoint: string, payload: any): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${endpoint}`;
  const authHeaders = await authService.getAuthHeaders();
  const headers = { ...authHeaders, 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers: headers as HeadersInit,
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

const deleteMethod = async <T>(endpoint: string): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${endpoint}`;
  const authHeaders = await authService.getAuthHeaders();
  const response = await fetch(fullUrl, {
    method: 'DELETE',
    headers: authHeaders as HeadersInit,
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
const getItems = async (itemGroups: string[], priceList?: string): Promise<Item[]> => {
  // First get the items
  const items = await get<Item[]>(`resource/Item?fields=${encodeURIComponent('["name", "item_name", "item_group", "stock_uom", "standard_rate"]')}&filters=${encodeURIComponent(JSON.stringify([["item_group", "in", itemGroups]]))}&limit_page_length=0`);
  
  console.log('Fetched items from API:', items.length);
  // Log a sample item to debug price issues
  if (items.length > 0) {
    console.log('Sample item data:', {
      name: items[0].name,
      item_name: items[0].item_name,
      standard_rate: items[0].standard_rate,
      standard_rate_type: typeof items[0].standard_rate
    });
  }
  
  // Create a map for prices from Price List if provided
  const priceMap = new Map<string, number>();
  if (priceList) {
    try {
      console.log('Fetching prices from Price List:', priceList);
      const itemPrices = await get<any[]>(`resource/Item Price?fields=${encodeURIComponent('["item_code", "price_list_rate"]')}&filters=${encodeURIComponent(JSON.stringify([["price_list", "=", priceList], ["item_code", "in", items.map(item => item.name)]]))}&limit_page_length=0`);
      
      itemPrices.forEach(ip => {
        if (ip.price_list_rate && !isNaN(Number(ip.price_list_rate))) {
          priceMap.set(ip.item_code, Number(ip.price_list_rate));
        }
      });
      console.log(`Fetched ${priceMap.size} prices from Price List`);
    } catch (error) {
      console.warn('Could not fetch prices from Price List:', error);
    }
  }
  
  // Then get stock quantities from Bin doctype
  try {
    const bins = await get<any[]>(`resource/Bin?fields=${encodeURIComponent('["item_code", "actual_qty"]')}&filters=${encodeURIComponent(JSON.stringify([["item_code", "in", items.map(item => item.name)]]))}&limit_page_length=0`);
    
    // Create a map of item_code to actual_qty
    const stockMap = new Map();
    bins.forEach(bin => {
      stockMap.set(bin.item_code, (stockMap.get(bin.item_code) || 0) + bin.actual_qty);
    });
    
    // Add actual_qty to items and ensure standard_rate is a number (not null/undefined)
    // Use Price List rate if available, otherwise fall back to standard_rate
    return items.map(item => {
      let rate = item.standard_rate;
      
      // If we have a price from Price List, use it instead
      if (priceMap.has(item.name)) {
        rate = priceMap.get(item.name)!;
        console.log(`Using Price List rate for ${item.name}: ${rate} (instead of standard_rate: ${item.standard_rate})`);
      }
      
      // Handle null, undefined, or non-numeric values
      const standardRate = (rate !== null && rate !== undefined && !isNaN(Number(rate))) ? Number(rate) : 0;
      
      if (standardRate === 0 && rate !== 0) {
        console.warn(`Item ${item.name} (${item.item_name}) has invalid standard_rate:`, rate);
      }
      
      return {
        ...item,
        standard_rate: standardRate,
        actual_qty: stockMap.get(item.name) || 0
      };
    });
  } catch (error) {
    console.warn('Could not fetch stock quantities:', error);
    // Return items with actual_qty as 0 if stock fetch fails, but still fix standard_rate
    // Use Price List rate if available, otherwise fall back to standard_rate
    return items.map(item => {
      let rate = item.standard_rate;
      
      // If we have a price from Price List, use it instead
      if (priceMap.has(item.name)) {
        rate = priceMap.get(item.name)!;
      }
      
      const standardRate = (rate !== null && rate !== undefined && !isNaN(Number(rate))) ? Number(rate) : 0;
      
      if (standardRate === 0 && rate !== 0) {
        console.warn(`Item ${item.name} (${item.item_name}) has invalid standard_rate:`, rate);
      }
      
      return {
        ...item,
        standard_rate: standardRate,
        actual_qty: 0
      };
    });
  }
};
const getCustomers = async (customerGroups: string[]): Promise<Customer[]> => get<Customer[]>(`resource/Customer?fields=${encodeURIComponent('["name", "customer_name", "customer_group"]')}&filters=${encodeURIComponent(JSON.stringify([["customer_group", "in", customerGroups]]))}&limit_page_length=0`);
const createSalesOrder = async (payload: SalesOrderPayload): Promise<any> => post<any>('resource/Sales Order', payload);

export interface SalesOrder {
  name: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
  outstanding_amount?: number;
  advance_paid?: number;
  creation: string;
  items?: { item_code: string; item_name: string; qty: number; rate: number }[];
}

const getSalesOrders = async (owner: string): Promise<SalesOrder[]> => {
  const fields = [
    'name', 'docstatus', 'customer', 'customer_name',
    'grand_total', 'advance_paid', 'creation'
  ];
  const filters = [['owner', '=', owner]];
  return getList<SalesOrder[]>('Sales Order', filters, fields);
};

const getSalesOrder = async (order_id: string): Promise<any> => {
  console.log('Fetching order details for:', order_id);
  console.log('API_BASE_URL:', API_BASE_URL);
  
          // Include payment-related fields to fetch
          const fields = [
            'name', 'docstatus', 'customer', 'customer_name', 'grand_total', 
            'outstanding_amount', 'advance_paid', 'creation', 'items'
          ];
  const fieldsParam = encodeURIComponent(JSON.stringify(fields));
  
  // Try different endpoint formats with fields parameter
  const endpoint = `resource/Sales Order/${encodeURIComponent(order_id)}?fields=${fieldsParam}`;
  console.log('API endpoint:', endpoint);
  console.log('Full URL will be:', `${API_BASE_URL}/api/${endpoint}`);
  
  try {
    return await get<any>(endpoint);
  } catch (error) {
    console.error('First attempt failed, trying alternative format...');
    // Try without encoding the order ID
    const altEndpoint = `resource/Sales Order/${order_id}?fields=${fieldsParam}`;
    console.log('Alternative endpoint:', altEndpoint);
    return get<any>(altEndpoint);
  }
};

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
  reference_no?: string;
  reference_date?: string;
}

const postMethod = async <T>(method: string, payload: any): Promise<T> => {
  const fullUrl = `${API_BASE_URL}/api/${method}`;
  const authHeaders = await authService.getAuthHeaders();
  const headers = { ...authHeaders, 'Content-Type': 'application/json' };
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: headers as HeadersInit,
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

const createCustomer = async (customerData: any): Promise<any> => {
  return post<any>('resource/Customer', customerData);
};

const createContact = async (contactData: any): Promise<any> => {
  return post<any>('resource/Contact', contactData);
};

const createAddress = async (addressData: any): Promise<any> => {
  return post<any>('resource/Address', addressData);
};

const getModeOfPaymentDetails = async (name: string): Promise<any> => get<any>(`resource/Mode of Payment/${encodeURIComponent(name)}`);

const getModeOfPayments = async (): Promise<any[]> => get<any[]>(`resource/Mode of Payment?fields=${encodeURIComponent('["name", "mode_of_payment"]')}&limit_page_length=0`);

const getCompanyDetails = async (company: string): Promise<any> => get<any>(`resource/Company/${encodeURIComponent(company)}`);

const getDefaultAccounts = async (company: string): Promise<any> => {
  const companyDetails = await getCompanyDetails(company);
  return {
    cash: companyDetails.default_cash_account || 'Cash',
    bank: companyDetails.default_bank_account || 'Bank',
    receivable: companyDetails.default_receivable_account || 'Debtors'
  };
};

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

const getCustomerDetails = async (customerId: string): Promise<any> => {
  return get<any>(`resource/Customer/${encodeURIComponent(customerId)}`);
};

const getCustomerContacts = async (customerId: string): Promise<Contact[]> => {
  // For now, return empty array - contacts will need to be added fresh
  // TODO: Implement proper contact fetching when we have access to proper ERPNext API
  console.log('Loading contacts for customer:', customerId);
  return [];
};

const getCustomerAddresses = async (customerId: string): Promise<Address[]> => {
  // For now, return empty array - addresses will need to be added fresh
  // TODO: Implement proper address fetching when we have access to proper ERPNext API
  console.log('Loading addresses for customer:', customerId);
  return [];
};

const updateContact = async (contactId: string, data: any): Promise<any> => {
  const payload = { ...data, doctype: 'Contact' };
  return put<any>(`resource/Contact/${encodeURIComponent(contactId)}`, payload);
};

const updateAddress = async (addressId: string, data: any): Promise<any> => {
  const payload = { ...data, doctype: 'Address' };
  return put<any>(`resource/Address/${encodeURIComponent(addressId)}`, payload);
};

const deleteContact = async (contactId: string): Promise<any> => {
  return deleteMethod<any>(`resource/Contact/${encodeURIComponent(contactId)}`);
};

const deleteAddress = async (addressId: string): Promise<any> => {
  return deleteMethod<any>(`resource/Address/${encodeURIComponent(addressId)}`);
};

export interface Visit {
  name?: string;
  customer: string;
  customer_name?: string;
  visit_date: string;
  visit_comments?: string;
  customer_feedback?: string;
  status?: string;
  seller?: string;
  samples?: VisitSample[];
}

export interface VisitSample {
  item_code: string;
  item_name?: string;
  qty: number;
  uom?: string;
}

export interface ServicePlan {
  name?: string;
  customer: string;
  customer_name?: string;
  plan_date: string;
  seller?: string;
  visits?: Visit[];
}

const createVisit = async (visitData: Visit): Promise<any> => {
  const payload = {
    doctype: 'Visit',
    ...visitData,
  };
  return post<any>('resource/Visit', payload);
};

const getVisits = async (seller?: string): Promise<Visit[]> => {
  const filters = seller ? [['seller', '=', seller]] : [];
  const fields = ['name', 'customer', 'customer_name', 'visit_date', 'visit_comments', 'customer_feedback', 'status', 'seller'];
  return getList<Visit[]>('Visit', filters, fields);
};

const getVisit = async (visitId: string): Promise<Visit> => {
  return get<Visit>(`resource/Visit/${encodeURIComponent(visitId)}`);
};

const updateVisit = async (visitId: string, visitData: Partial<Visit>): Promise<any> => {
  const payload = { ...visitData, doctype: 'Visit' };
  return put<any>(`resource/Visit/${encodeURIComponent(visitId)}`, payload);
};

const createServicePlan = async (planData: ServicePlan): Promise<any> => {
  const payload = {
    doctype: 'Service Plan',
    ...planData,
  };
  return post<any>('resource/Service Plan', payload);
};

const getServicePlans = async (seller?: string): Promise<ServicePlan[]> => {
  const filters = seller ? [['seller', '=', seller]] : [];
  const fields = ['name', 'customer', 'customer_name', 'plan_date', 'seller'];
  return getList<ServicePlan[]>('Service Plan', filters, fields);
};

const getServicePlan = async (planId: string): Promise<ServicePlan> => {
  return get<ServicePlan>(`resource/Service Plan/${encodeURIComponent(planId)}`);
};

const getOrCreateWarehouse = async (warehouseName: string, company: string): Promise<string> => {
  try {
    // Try to get existing warehouse
    const warehouse = await get<any>(`resource/Warehouse/${encodeURIComponent(warehouseName)}`);
    return warehouse.name;
  } catch (error) {
    // Warehouse doesn't exist, create it
    try {
      const warehouseData = {
        doctype: 'Warehouse',
        warehouse_name: warehouseName,
        company: company,
        warehouse_type: 'Store',
      };
      const newWarehouse = await post<any>('resource/Warehouse', warehouseData);
      return newWarehouse.name;
    } catch (createError) {
      console.error('Failed to create warehouse:', createError);
      throw new Error(`Failed to create warehouse: ${warehouseName}`);
    }
  }
};

const createStockEntry = async (entryData: any): Promise<any> => {
  const payload = {
    doctype: 'Stock Entry',
    ...entryData,
  };
  return post<any>('resource/Stock Entry', payload);
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
  getModeOfPayments,
  getCompanyDetails,
  getDefaultAccounts,
  saveDoc,
  submitDoc,
  createCustomer,
  createContact,
  createAddress,
  getCustomerDetails,
  getCustomerContacts,
  getCustomerAddresses,
  updateContact,
  updateAddress,
  deleteContact,
  deleteAddress,
  createVisit,
  getVisits,
  getVisit,
  updateVisit,
  createServicePlan,
  getServicePlans,
  getServicePlan,
  getOrCreateWarehouse,
  createStockEntry,
};

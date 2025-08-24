import { authService } from './authService';
import { type PosProfileData, type Item, type Customer, type Warehouse } from '../db/db';

// The existing PosProfile type is for the list view, which is fine.
export interface PosProfile {
  name: string;
  company: string;
  currency: string;
}

/**
 * A generic GET request handler for fetching data from the ERPNext API.
 */
const get = async <T>(endpoint: string): Promise<T> => {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  if (!erpNextUrl) {
    throw new Error('ERPNext URL not set.');
  }
  const fullUrl = `${erpNextUrl}/api/${endpoint}`;
  try {
    const response = await fetch(fullUrl, { headers: authService.getAuthHeaders() });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request to ${endpoint} failed with status ${response.status}: ${errorText}`);
      throw new Error(`API request failed. See console for details.`);
    }
    const data = await response.json();
    // ERPNext API responses are wrapped in a 'data' key.
    return data.data as T;
  } catch (error) {
    console.error(`An error occurred while fetching from ${fullUrl}:`, error);
    throw error;
  }
};

/**
 * Fetches the list of available POS Profiles (summary view).
 */
const getPosProfiles = async (): Promise<PosProfile[]> => {
  const fields = '["name", "company", "currency"]';
  return get<PosProfile[]>(`resource/POS Profile?fields=${encodeURIComponent(fields)}`);
};

/**
 * Fetches the full document for a single, specified POS Profile.
 */
const getPosProfileDetails = async (profileName: string): Promise<PosProfileData> => {
  return get<PosProfileData>(`resource/POS Profile/${encodeURIComponent(profileName)}`);
};

/**
 * Fetches items, filtered by the provided list of item groups.
 */
const getItems = async (itemGroups: string[]): Promise<Item[]> => {
  const fields = '["name", "item_name", "item_group", "stock_uom", "standard_rate"]';
  const filters = JSON.stringify([["item_group", "in", itemGroups]]);
  // Use limit_page_length=0 to fetch all matching records.
  const endpoint = `resource/Item?fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}&limit_page_length=0`;
  return get<Item[]>(endpoint);
};

/**
 * Fetches customers, filtered by the provided list of customer groups.
 */
const getCustomers = async (customerGroups: string[]): Promise<Customer[]> => {
  const fields = '["name", "customer_name", "customer_group"]';
  const filters = JSON.stringify([["customer_group", "in", customerGroups]]);
  const endpoint = `resource/Customer?fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}&limit_page_length=0`;
  return get<Customer[]>(endpoint);
};

/**
 * Fetches warehouse details for the provided list of warehouse names.
 */
const getWarehouses = async (warehouseNames: string[]): Promise<Warehouse[]> => {
  const fields = '["name", "warehouse_name", "company"]';
  const filters = JSON.stringify([["name", "in", warehouseNames]]);
  const endpoint = `resource/Warehouse?fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}&limit_page_length=0`;
  return get<Warehouse[]>(endpoint);
};

export const apiService = {
  getPosProfiles,
  getPosProfileDetails,
  getItems,
  getCustomers,
  getWarehouses,
};

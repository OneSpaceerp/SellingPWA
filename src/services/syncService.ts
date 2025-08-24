import { db } from '../db/db';
import { apiService } from './apiService';

/**
 * Orchestrates the full data synchronization process.
 * It fetches all necessary data from ERPNext based on the selected POS Profile
 * and stores it in the local IndexedDB database.
 */
const syncAllData = async (): Promise<void> => {
  const profileName = localStorage.getItem('erpnext-pos-profile');
  if (!profileName) {
    throw new Error('Cannot sync: No POS Profile is selected.');
  }

  console.log(`Starting data synchronization for profile: ${profileName}`);

  // 1. Fetch and store the full POS Profile details.
  console.log('Fetching POS Profile details...');
  const posProfile = await apiService.getPosProfileDetails(profileName);
  await db.posProfiles.put(posProfile);
  console.log('POS Profile details synced.');

  // 2. Extract filter criteria from the POS Profile.
  // These field names ('item_groups', 'customer_groups', 'warehouses') are based on the
  // likely structure of the POS Awesome DocType. They might need adjustment if the
  // actual field names are different. We assume they are child tables.
  const itemGroups = posProfile.item_groups?.map((ig: any) => ig.item_group) || [];
  const customerGroups = posProfile.customer_groups?.map((cg: any) => cg.customer_group) || [];
  const warehouses = posProfile.warehouses?.map((w: any) => w.warehouse) || [];

  // 3. Fetch and store Items based on the profile's item groups.
  if (itemGroups.length > 0) {
    console.log(`Fetching items for groups: ${itemGroups.join(', ')}`);
    const items = await apiService.getItems(itemGroups);
    await db.items.bulkPut(items);
    console.log(`Synced ${items.length} items.`);
  } else {
    console.log('No item groups defined in POS Profile. Skipping item sync.');
  }

  // 4. Fetch and store Customers based on the profile's customer groups.
  if (customerGroups.length > 0) {
    console.log(`Fetching customers for groups: ${customerGroups.join(', ')}`);
    const customers = await apiService.getCustomers(customerGroups);
    await db.customers.bulkPut(customers);
    console.log(`Synced ${customers.length} customers.`);
  } else {
    console.log('No customer groups defined in POS Profile. Skipping customer sync.');
  }

  // 5. Fetch and store Warehouse details.
  if (warehouses.length > 0) {
    console.log(`Fetching details for warehouses: ${warehouses.join(', ')}`);
    const warehouseDetails = await apiService.getWarehouses(warehouses);
    await db.warehouses.bulkPut(warehouseDetails);
    console.log(`Synced ${warehouseDetails.length} warehouses.`);
  } else {
    console.log('No warehouses defined in POS Profile. Skipping warehouse sync.');
  }

  console.log('Synchronization process completed successfully.');
};

export const syncService = {
  syncAllData,
};

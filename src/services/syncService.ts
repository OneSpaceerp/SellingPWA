import { db } from '../db/db';
import { apiService } from './apiService';

const syncAllData = async (): Promise<void> => {
  const profileName = localStorage.getItem('erpnext-pos-profile');
  if (!profileName) {
    throw new Error('Cannot sync: No POS Profile is selected.');
  }

  console.log(`Starting data synchronization for profile: ${profileName}`);

  const posProfile = await apiService.getPosProfileDetails(profileName);
  await db.posProfiles.put(posProfile);
  console.log('POS Profile details synced.');

  const itemGroups = posProfile.item_groups?.map((ig: any) => ig.item_group) || [];
  const customerGroups = posProfile.customer_groups?.map((cg: any) => cg.customer_group) || [];
  const warehouses = posProfile.warehouses?.map((w: any) => w.warehouse) || [];

  if (itemGroups.length > 0) {
    const items = await apiService.getItems(itemGroups);
    await db.items.bulkPut(items);
    console.log(`Synced ${items.length} items.`);
  } else {
    console.log('No item groups defined in POS Profile. Skipping item sync.');
  }

  if (customerGroups.length > 0) {
    const customers = await apiService.getCustomers(customerGroups);
    await db.customers.bulkPut(customers);
    console.log(`Synced ${customers.length} customers.`);
  } else {
    console.log('No customer groups defined in POS Profile. Skipping customer sync.');
  }

  if (warehouses.length > 0) {
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

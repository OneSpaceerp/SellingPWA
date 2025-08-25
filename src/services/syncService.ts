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

  if (itemGroups.length > 0) {
    console.log(`Fetching items for groups: ${itemGroups.join(', ')}`);
    const items = await apiService.getItems(itemGroups);
    await db.items.bulkPut(items);
    console.log(`Synced ${items.length} items.`);
  } else {
    console.log('No item groups defined in POS Profile. Skipping item sync.');
  }

  if (customerGroups.length > 0) {
    console.log(`Fetching customers for groups: ${customerGroups.join(', ')}`);
    const customers = await apiService.getCustomers(customerGroups);
    await db.customers.bulkPut(customers);
    console.log(`Synced ${customers.length} customers.`);
  } else {
      console.log('No customer groups defined in POS Profile. Skipping customer sync.');
  }

  // Warehouse sync is no longer needed as we use the default from the profile.
  // The warehouse name is synced as part of the POS Profile object itself.

  console.log('Synchronization process completed successfully.');
};

export const syncService = {
  syncAllData,
};

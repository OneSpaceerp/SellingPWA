import Dexie, { type Table } from 'dexie';

// Define the data structures for our local database.
// These interfaces will ensure type safety when we interact with Dexie.

export interface PosProfileData {
  name: string; // Primary key
  company: string;
  // We use a generic index signature to allow for any other properties
  // from the ERPNext DocType, since POS Awesome has many settings.
  [key: string]: any;
}

export interface Item {
  name: string; // Primary key (item_code)
  item_name: string;
  item_group: string;
  stock_uom: string;
  [key: string]: any;
}

export interface Customer {
  name: string; // Primary key (customer_id)
  customer_name: string;
  customer_group: string;
  [key: string]: any;
}

export interface Warehouse {
  name: string; // Primary key
  warehouse_name: string;
  [key: string]: any;
}

/**
 * Defines the application's database using Dexie.js.
 * This class sets up the database name, version, and table schemas.
 */
class AppDatabase extends Dexie {
  // Declare tables to be type-safe
  posProfiles!: Table<PosProfileData, string>;
  items!: Table<Item, string>;
  customers!: Table<Customer, string>;
  warehouses!: Table<Warehouse, string>;

  constructor() {
    super('pwa-sales-app-db');
    this.version(1).stores({
      // Define the schema for each table.
      // The first field is the primary key. Subsequent fields are indexes.
      // Indexing fields like 'item_group' and 'customer_group' will be
      // crucial for fast filtering in the UI later.
      posProfiles: 'name',
      items: 'name, item_group',
      customers: 'name, customer_group',
      warehouses: 'name',
    });
  }
}

// Export a singleton instance of the database
export const db = new AppDatabase();

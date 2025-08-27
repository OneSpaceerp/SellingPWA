import Dexie, { type Table } from 'dexie';
import type { Order } from './Order';

// Define the data structures for our local database.
export interface PosProfileData {
  name: string; // Primary key
  company: string;
  currency: string;
  [key: string]: any; // Allow for dynamic properties from the DocType
}

export interface Item {
  name: string; // Primary key (item_code)
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate?: number;
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

class AppDatabase extends Dexie {
  posProfiles!: Table<PosProfileData, string>;
  items!: Table<Item, string>;
  customers!: Table<Customer, string>;
  warehouses!: Table<Warehouse, string>;
  orders!: Table<Order, number>;

  constructor() {
    super('pwa-sales-app-db');
    this.version(1).stores({
      posProfiles: 'name',
      items: 'name, item_group',
      customers: 'name, customer_group',
      warehouses: 'name',
    });
    this.version(2).stores({
      orders: '++id, order_id, customer, created_at, created_by',
    });
  }
}

export const db = new AppDatabase();

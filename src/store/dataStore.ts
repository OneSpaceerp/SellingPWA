import { create } from 'zustand';
import { apiService, type Item, type Customer } from '../services/apiService';

interface DataState {
  items: Item[];
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  syncData: (
    itemGroups: { group: string }[],
    customerGroups: { group: string }[]
  ) => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  items: [],
  customers: [],
  isLoading: false,
  error: null,
  syncData: async (itemGroups, customerGroups) => {
    set({ isLoading: true, error: null });
    try {
      const itemGroupNames =
        itemGroups?.map((g) => g.group).filter(Boolean) ?? [];
      const customerGroupNames =
        customerGroups?.map((g) => g.group).filter(Boolean) ?? [];

      const [items, customers] = await Promise.all([
        itemGroupNames.length > 0
          ? apiService.getItems(itemGroupNames)
          : Promise.resolve([]),
        customerGroupNames.length > 0
          ? apiService.getCustomers(customerGroupNames)
          : Promise.resolve([]),
      ]);

      set({ items, customers, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      console.error('Failed to sync data:', e);
    }
  },
}));

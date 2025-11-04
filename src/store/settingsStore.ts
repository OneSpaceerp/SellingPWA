import { create } from 'zustand';
import { apiService, type PosProfileData } from '../services/apiService';
import { useDataStore } from './dataStore';

interface SettingsState {
  posProfile: PosProfileData | null;
  currency: string;
  isLoading: boolean;
  loadSettings: (force?: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  posProfile: null,
  currency: '$', // A sensible default until settings are loaded
  isLoading: false,

  loadSettings: async (force = false) => {
    if (get().posProfile && !force) {
      return; // Prevent re-loading
    }
    set({ isLoading: true });
    try {
      const profileName = localStorage.getItem('erpnext-pos-profile');
      if (!profileName) {
        set({ isLoading: false });
        return;
      }
      const profile = await apiService.getPosProfileDetails(profileName);
      if (!profile) {
        console.error(`Failed to load settings: POS Profile "${profileName}" not found.`);
        set({ isLoading: false });
        return;
      }

      // Trigger data synchronization with price list
      const priceList = profile.selling_price_list || profile.price_list;
      await useDataStore.getState().syncData(profile.item_groups, profile.customer_groups, priceList);

      set({
        posProfile: profile,
        currency: profile.currency || '$',
        isLoading: false,
      });
    } catch (error) {
      console.error("An unexpected error occurred while loading settings:", error);
      set({ isLoading: false });
    }
  },
}));


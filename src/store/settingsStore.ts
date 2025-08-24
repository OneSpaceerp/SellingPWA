import { create } from 'zustand';
import { db, type PosProfileData } from '../db/db';

interface SettingsState {
  posProfile: PosProfileData | null;
  currency: string;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  posProfile: null,
  currency: '$', // A sensible default until settings are loaded

  /**
   * Fetches the active POS Profile from the local database and updates the store's state.
   */
  loadSettings: async () => {
    // Prevent re-loading if already loaded
    if (get().posProfile) {
      return;
    }

    try {
      const profileName = localStorage.getItem('erpnext-pos-profile');
      if (!profileName) {
        console.warn("Could not load settings: No POS Profile name found in local storage.");
        return;
      }

      const profile = await db.posProfiles.get(profileName);
      if (!profile) {
        console.error(`Failed to load settings: POS Profile "${profileName}" not found in local DB.`);
        return;
      }

      console.log("POS Profile settings loaded:", profile);
      set({
        posProfile: profile,
        currency: profile.currency || '$', // Use profile currency, fallback to $
      });
    } catch (error) {
      console.error("An unexpected error occurred while loading settings:", error);
      // In case of error, the store will retain its default state.
    }
  },
}));

// Immediately attempt to load the settings when the app starts.
// This makes the settings available globally without needing to call it from a component.
useSettingsStore.getState().loadSettings();

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

  loadSettings: async () => {
    if (get().posProfile) {
      return; // Prevent re-loading
    }
    try {
      const profileName = localStorage.getItem('erpnext-pos-profile');
      if (!profileName) {
        return;
      }
      const profile = await db.posProfiles.get(profileName);
      if (!profile) {
        console.error(`Failed to load settings: POS Profile "${profileName}" not found in local DB.`);
        return;
      }
      set({
        posProfile: profile,
        currency: profile.currency || '$',
      });
    } catch (error) {
      console.error("An unexpected error occurred while loading settings:", error);
    }
  },
}));

// Immediately attempt to load the settings when the app starts.
useSettingsStore.getState().loadSettings();

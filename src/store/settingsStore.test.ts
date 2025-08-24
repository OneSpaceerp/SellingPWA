import { useSettingsStore } from './settingsStore';
import { db } from '../db/db';
import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { type PosProfileData } from '../db/db';

// Mock the entire db module to control its behavior in tests
vi.mock('../db/db', () => ({
  db: {
    posProfiles: {
      get: vi.fn(),
    },
  },
}));

// A mock POS Profile object for our tests
const mockProfile: PosProfileData = {
  name: 'Test Profile',
  company: 'Test Inc',
  currency: 'EGP',
  payments: [{ mode_of_payment: 'Cash' }, { mode_of_payment: 'Credit Card' }],
};

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset all mocks and clear local storage before each test
    vi.clearAllMocks();
    localStorage.clear();
    // Reset the store to its initial state
    act(() => {
      useSettingsStore.setState({ posProfile: null, currency: '$' });
    });
  });

  it('should have a default initial state', () => {
    const { posProfile, currency } = useSettingsStore.getState();
    expect(posProfile).toBeNull();
    expect(currency).toBe('$');
  });

  it('should load settings successfully from DB and update the store state', async () => {
    // Arrange: Set up the conditions for the test
    localStorage.setItem('erpnext-pos-profile', 'Test Profile');
    (db.posProfiles.get as any).mockResolvedValue(mockProfile);

    // Act: Run the function we want to test
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    // Assert: Check if the outcome is as expected
    const { posProfile, currency } = useSettingsStore.getState();
    expect(db.posProfiles.get).toHaveBeenCalledWith('Test Profile');
    expect(posProfile).toEqual(mockProfile);
    expect(currency).toBe('EGP');
  });

  it('should not attempt to load settings if profile name is not in local storage', async () => {
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    const { posProfile, currency } = useSettingsStore.getState();
    expect(db.posProfiles.get).not.toHaveBeenCalled();
    expect(posProfile).toBeNull(); // State should remain unchanged
    expect(currency).toBe('$');
  });

  it('should handle the case where the profile is not found in the database', async () => {
    localStorage.setItem('erpnext-pos-profile', 'Test Profile');
    (db.posProfiles.get as any).mockResolvedValue(undefined); // Mock DB returning nothing

    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    const { posProfile, currency } = useSettingsStore.getState();
    expect(db.posProfiles.get).toHaveBeenCalledWith('Test Profile');
    expect(posProfile).toBeNull(); // State should remain unchanged
    expect(currency).toBe('$');
  });

  it('should not re-fetch settings from the DB if they are already loaded in the store', async () => {
    // Arrange: Manually set the state to simulate already-loaded settings
    act(() => {
      useSettingsStore.setState({ posProfile: mockProfile, currency: 'EGP' });
    });

    // Act: Call the load function again
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    // Assert: The DB function should not have been called a second time
    expect(db.posProfiles.get).not.toHaveBeenCalled();
  });
});

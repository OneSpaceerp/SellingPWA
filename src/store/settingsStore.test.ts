import { useSettingsStore } from './settingsStore';
import { db } from '../db/db';
import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { type PosProfileData } from '../db/db';

vi.mock('../db/db', () => ({
  db: {
    posProfiles: {
      get: vi.fn(),
    },
  },
}));

const mockProfile: PosProfileData = {
  name: 'Test Profile',
  company: 'Test Inc',
  currency: 'EGP',
  payments: [{ mode_of_payment: 'Cash' }],
};

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    act(() => {
      useSettingsStore.setState({ posProfile: null, currency: '$' });
    });
  });

  it('should load settings successfully from DB', async () => {
    localStorage.setItem('erpnext-pos-profile', 'Test Profile');
    (db.posProfiles.get as any).mockResolvedValue(mockProfile);

    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    const { posProfile, currency } = useSettingsStore.getState();
    expect(db.posProfiles.get).toHaveBeenCalledWith('Test Profile');
    expect(posProfile).toEqual(mockProfile);
    expect(currency).toBe('EGP');
  });

  it('should not load settings if profile name is not in local storage', async () => {
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });
    expect(db.posProfiles.get).not.toHaveBeenCalled();
  });

  it('should not re-fetch settings if already loaded', async () => {
    act(() => {
      useSettingsStore.setState({ posProfile: mockProfile, currency: 'EGP' });
    });
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });
    expect(db.posProfiles.get).not.toHaveBeenCalled();
  });
});

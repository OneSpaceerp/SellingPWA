import { useSettingsStore } from './settingsStore';
import { apiService, type PosProfileData } from '../services/apiService';
import { act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../services/apiService', () => ({
  apiService: {
    getPosProfileDetails: vi.fn(),
  },
}));

const mockProfile: PosProfileData = {
  name: 'Test Profile',
  company: 'Test Inc',
  currency: 'EGP',
  item_groups: [],
  customer_groups: [],
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

  it('should load settings successfully from API', async () => {
    localStorage.setItem('erpnext-pos-profile', 'Test Profile');
    (apiService.getPosProfileDetails as vi.Mock).mockResolvedValue(mockProfile);

    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });

    const { posProfile, currency } = useSettingsStore.getState();
    expect(apiService.getPosProfileDetails).toHaveBeenCalledWith('Test Profile');
    expect(posProfile).toEqual(mockProfile);
    expect(currency).toBe('EGP');
  });

  it('should not load settings if profile name is not in local storage', async () => {
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });
    expect(apiService.getPosProfileDetails).not.toHaveBeenCalled();
  });

  it('should not re-fetch settings if already loaded', async () => {
    act(() => {
      useSettingsStore.setState({ posProfile: mockProfile, currency: 'EGP' });
    });
    await act(async () => {
      await useSettingsStore.getState().loadSettings();
    });
    expect(apiService.getPosProfileDetails).not.toHaveBeenCalled();
  });
});

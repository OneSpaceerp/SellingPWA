import { render, screen, waitFor } from '../test/test-utils';
import { CatalogPage } from './CatalogPage';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type Item, type PosProfileData } from '../services/apiService';
import { vi } from 'vitest';

vi.mock('../store/cartStore');
vi.mock('../store/settingsStore');
vi.mock('../services/apiService');

const mockItems: Item[] = [
  { name: 'ITEM001', item_name: 'Apple', standard_rate: 1, item_group: 'Fruit', stock_uom: 'Nos' },
  { name: 'ITEM002', item_name: 'Banana', standard_rate: 2, item_group: 'Fruit', stock_uom: 'Nos' },
];

const mockProfile: PosProfileData = {
  name: 'Test Profile',
  company: 'Test Inc',
  currency: 'USD',
  item_groups: [{ group: 'Fruit' }],
  customer_groups: [],
};

describe('CatalogPage', () => {
  beforeEach(() => {
    (useCartStore as any).mockReturnValue({ addItem: vi.fn() });
    (apiService.getItems as vi.Mock).mockResolvedValue(mockItems);
  });

  it('should display a loading state initially', () => {
    (useSettingsStore as any).mockReturnValue({ posProfile: null });
    render(<CatalogPage />);
    expect(screen.getByTestId('catalog-loader')).toBeInTheDocument();
  });

  it('should render the list of items', async () => {
    (useSettingsStore as any).mockReturnValue({ posProfile: mockProfile, currency: 'USD' });
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  it('should display an empty state message', async () => {
    (useSettingsStore as any).mockReturnValue({ posProfile: mockProfile, currency: 'USD' });
    (apiService.getItems as vi.Mock).mockResolvedValue([]);
    render(<CatalogPage />);

    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });
});

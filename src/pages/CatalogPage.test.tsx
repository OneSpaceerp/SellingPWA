import { render, screen, cleanup } from '@testing-library/react';
import { CatalogPage } from './CatalogPage';
import { useCartStore } from '../store/cartStore';
import * as dexieReactHooks from 'dexie-react-hooks';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { vi } from 'vitest';
import { type Item } from '../db/db';

vi.mock('dexie-react-hooks');
vi.mock('../store/cartStore');
vi.mock('../store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => 'USD'),
}));

const mockItems: Item[] = [
  { name: 'ITEM001', item_name: 'Apple', standard_rate: 1, item_group: 'Fruit', stock_uom: 'Nos' },
  { name: 'ITEM002', item_name: 'Banana', standard_rate: 2, item_group: 'Fruit', stock_uom: 'Nos' },
];

describe('CatalogPage', () => {
  let mockAddItem: () => void;

  beforeEach(() => {
    mockAddItem = vi.fn();
    (useCartStore as any).mockImplementation((selector: any) => selector({ addItem: mockAddItem }));
    (dexieReactHooks.useLiveQuery as any).mockReturnValue(mockItems);
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <MantineProvider>
        <Notifications />
        <CatalogPage />
      </MantineProvider>
    );
  };

  it('should render the list of items', () => {
    renderComponent();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('should display a loading state', () => {
    (dexieReactHooks.useLiveQuery as any).mockReturnValue(undefined);
    renderComponent();
    expect(screen.getByTestId('catalog-loader')).toBeInTheDocument();
  });

  it('should display an empty state message', () => {
    (dexieReactHooks.useLiveQuery as any).mockReturnValue([]);
    renderComponent();
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });
});

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CatalogPage } from './CatalogPage';
import { useCartStore } from '../store/cartStore';
import * as dexieReactHooks from 'dexie-react-hooks';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { vi } from 'vitest';
import { type Item } from '../db/db';

// Mock the dependencies using Vitest
vi.mock('dexie-react-hooks');
vi.mock('../store/cartStore');

// Mock item data to be used in tests
const mockItems: Item[] = [
  { name: 'ITEM001', item_name: 'Apple', standard_rate: 1, item_group: 'Fruit', stock_uom: 'Nos' },
  { name: 'ITEM002', item_name: 'Banana', standard_rate: 2, item_group: 'Fruit', stock_uom: 'Nos' },
  { name: 'ITEM003', item_name: 'Carrot', standard_rate: 3, item_group: 'Vegetable', stock_uom: 'Nos' },
];

describe('CatalogPage', () => {
  let mockAddItem: () => void;

  // Set up the mocks before each test
  beforeEach(() => {
    mockAddItem = vi.fn();
    // Mock the return value of the useCartStore hook
    (useCartStore as any).mockImplementation((selector: any) => {
        // This mock only needs to return the addItem function for this component
        const state = { addItem: mockAddItem };
        return selector(state);
    });
    // Mock the return value of the useLiveQuery hook
    (dexieReactHooks.useLiveQuery as any).mockReturnValue(mockItems);
  });

  // Clean up mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  // Helper function to render the component with necessary providers
  const renderComponent = () => {
    return render(
      <MantineProvider>
        <Notifications />
        <CatalogPage />
      </MantineProvider>
    );
  };

  it('should render the list of items provided by the database hook', () => {
    renderComponent();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Carrot')).toBeInTheDocument();
  });

  it('should call the addItem action from the cart store when "Add to Cart" is clicked', () => {
    renderComponent();
    // Get all "Add to Cart" buttons
    const addToCartButtons = screen.getAllByRole('button', { name: 'Add to Cart' });
    // Click the first button, which corresponds to "Apple"
    fireEvent.click(addToCartButtons[0]);

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should display a loading state when the items are initially undefined', () => {
    (dexieReactHooks.useLiveQuery as any).mockReturnValue(undefined);
    renderComponent();
    // Find the loader by the test ID we added to the component
    expect(screen.getByTestId('catalog-loader')).toBeInTheDocument();
  });

  it('should display an empty state message when no items are returned', () => {
    (dexieReactHooks.useLiveQuery as any).mockReturnValue([]);
    renderComponent();
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  // Note: Testing the live search filtering is complex as the logic resides inside the
  // useLiveQuery callback. A robust test would involve an integration test with a real
  // Dexie instance. For this component test, we've confirmed it renders the data
  // passed to it, which is the component's primary responsibility.
});

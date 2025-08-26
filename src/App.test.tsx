import { render, screen, cleanup } from './test/test-utils';
import App from './App';

// Mock authService to control authentication status in tests
vi.mock('./services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getAuthHeaders: vi.fn(() => ({})),
  },
}));
import { authService } from './services/authService';
import { apiService } from './services/apiService';

vi.mock('./services/apiService', () => ({
  apiService: {
    getPosProfiles: vi.fn(),
  },
}));

describe('App Routing', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders SetupPage when no URL is set', () => {
    (authService.isAuthenticated as any).mockReturnValue(true);
    localStorage.removeItem('erpnext-url');
    render(<App />);
    expect(screen.getByText('Connect to ERPNext')).toBeInTheDocument();
  });

  it('renders LoginPage when URL is set but user is not authenticated', () => {
    (authService.isAuthenticated as any).mockReturnValue(false);
    localStorage.setItem('erpnext-url', 'https://test.com');
    render(<App />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders PosProfileSelectionPage when authenticated but no profile is selected', async () => {
    (authService.isAuthenticated as any).mockReturnValue(true);
    localStorage.setItem('erpnext-url', 'https://test.com');
    localStorage.removeItem('erpnext-pos-profile');
    (apiService.getPosProfiles as any).mockResolvedValue([{ name: 'Test Profile', company: 'Test co', currency: 'USD' }]);
    render(<App />);
    expect(await screen.findByText(/select pos profile/i)).toBeInTheDocument();
  });

  it('renders the main AppLayout when fully configured', () => {
    (authService.isAuthenticated as any).mockReturnValue(true);
    localStorage.setItem('erpnext-url', 'https://test.com');
    localStorage.setItem('erpnext-pos-profile', 'Test Profile');
    render(<App />);
    // Check for an element unique to the AppLayout
    expect(screen.getByText('ERPNext Selling App')).toBeInTheDocument();
  });
});

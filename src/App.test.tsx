import { render, screen, cleanup } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

// Mock authService to control authentication status in tests
vi.mock('./services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
  },
}));
import { authService } from './services/authService';

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
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Connect to ERPNext')).toBeInTheDocument();
  });

  it('renders LoginPage when URL is set but user is not authenticated', () => {
    (authService.isAuthenticated as any).mockReturnValue(false);
    localStorage.setItem('erpnext-url', 'https://test.com');
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders PosProfileSelectionPage when authenticated but no profile is selected', () => {
    (authService.isAuthenticated as any).mockReturnValue(true);
    localStorage.setItem('erpnext-url', 'https://test.com');
    localStorage.removeItem('erpnext-pos-profile');
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText(/select pos profile/i)).toBeInTheDocument();
  });

  it('renders the main AppLayout when fully configured', () => {
    (authService.isAuthenticated as any).mockReturnValue(true);
    localStorage.setItem('erpnext-url', 'https://test.com');
    localStorage.setItem('erpnext-pos-profile', 'Test Profile');
    render(<MemoryRouter><App /></MemoryRouter>);
    // Check for an element unique to the AppLayout
    expect(screen.getByText('ERPNext Selling App')).toBeInTheDocument();
  });
});

import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

// Test suite for the main App component
describe('App', () => {
  // Cleanup the DOM after each test to prevent pollution
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('should render the SetupPage when no ERPNext URL is in local storage', () => {
    // Ensure localStorage is empty for this specific test
    localStorage.removeItem('erpnext-url');

    render(<App />);

    // Verify that elements unique to the SetupPage are present in the document
    expect(screen.getByText('Connect to ERPNext')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., https://my-erp.erpnext.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('should render the LoginPage when URL is set but user is not authenticated', () => {
    // Set up the state for this test case
    localStorage.setItem('erpnext-url', 'https://test.erpnext.com');
    sessionStorage.removeItem('erpnext-token');

    render(<App />);

    // Verify that elements unique to the LoginPage are present
    expect(screen.getByText('Login to ERPNext')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your API Secret')).toBeInTheDocument();
  });

  // We can add more tests here for the other states (POS Profile selection, main app view)
  // but this is sufficient for initial verification.
});

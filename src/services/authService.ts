const login = async (usr: string, pwd: string): Promise<{ success: boolean; user?: string; error?: string }> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  try {
    const response = await fetch(`${API_BASE_URL}/api/method/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `usr=${encodeURIComponent(usr)}&pwd=${encodeURIComponent(pwd)}`,
      credentials: 'include',
    });

    if (response.ok) {
      sessionStorage.setItem('erpnext-user', usr);
      return { success: true, user: usr };
    } else {
      const errorText = await response.text();
      console.error('Login failed:', response.status, errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('An error occurred during the login API call:', error);
    return { success: false, error: 'An unknown error occurred while trying to log in.' };
  }
};

const logout = () => {
  sessionStorage.removeItem('erpnext-user');
  localStorage.removeItem('erpnext-pos-profile');
};

const isAuthenticated = (): boolean => {
  return sessionStorage.getItem('erpnext-user') !== null;
};

const getLoggedInUser = (): string | null => {
  return sessionStorage.getItem('erpnext-user');
};

// Helper function to get a cookie value by name
const getCookieValue = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const getAuthHeaders = (): HeadersInit => {
  const user = getLoggedInUser();
  if (!user) {
    console.log('No logged in user found');
    return {};
  }
  
  console.log('Getting auth headers for user:', user);
  
  // Try to get API key from localStorage first
  const apiKey = localStorage.getItem('erpnext-api-key');
  if (apiKey) {
    console.log('Using API key authentication');
    return {
      'Authorization': `token ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }
  
  // For session-based authentication, ERPNext requires specific headers
  console.log('Using session-based authentication (cookies + CSRF token)');
  console.log('Available cookies:', document.cookie);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // ERPNext requires X-Frappe-CSRF-Token for session-based API calls
  const csrfToken = getCookieValue('_frappe_csrf_token') || getCookieValue('csrf_token');
  if (csrfToken) {
    console.log('Found CSRF token, adding X-Frappe-CSRF-Token header');
    headers['X-Frappe-CSRF-Token'] = csrfToken;
  } else {
    console.log('No CSRF token found in cookies');
  }
  
  // Also try to get the session ID from cookies
  const sessionId = getCookieValue('sid') || getCookieValue('session_id');
  if (sessionId) {
    console.log('Found session ID, adding X-Frappe-Session-ID header');
    headers['X-Frappe-Session-ID'] = sessionId;
  }
  
  console.log('Final headers:', headers);
  return headers;
};

export const authService = {
  login,
  logout,
  isAuthenticated,
  getLoggedInUser,
  getAuthHeaders,
};

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

const getAuthHeaders = async (): Promise<HeadersInit> => {
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
  // Try multiple possible CSRF token cookie names
  const csrfToken = getCookieValue('frappe_csrf_token') || 
                    getCookieValue('_frappe_csrf_token') || 
                    getCookieValue('csrf_token') ||
                    getCookieValue('frappe_csrf');
  
  if (csrfToken) {
    console.log('Found CSRF token, adding X-Frappe-CSRF-Token header');
    headers['X-Frappe-CSRF-Token'] = csrfToken;
  } else {
    console.log('No CSRF token found in cookies');
    // Try to get CSRF token from a GET request first
    console.log('Attempting to fetch CSRF token...');
    try {
      const csrfResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (csrfResponse.ok) {
        // Check if the response set any CSRF token cookies
        const setCookieHeader = csrfResponse.headers.get('set-cookie');
        if (setCookieHeader) {
          console.log('Set-Cookie header:', setCookieHeader);
          // Extract CSRF token from the set-cookie header
          const csrfMatch = setCookieHeader.match(/frappe_csrf_token=([^;]+)/);
          if (csrfMatch) {
            const newCsrfToken = csrfMatch[1];
            console.log('Found CSRF token from response:', newCsrfToken);
            headers['X-Frappe-CSRF-Token'] = newCsrfToken;
          }
        }
      }
    } catch (csrfError) {
      console.warn('Failed to fetch CSRF token:', csrfError);
    }
  }
  
  // Also try to get the session ID from cookies
  const sessionId = getCookieValue('sid') || 
                   getCookieValue('session_id') || 
                   getCookieValue('frappe_session');
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

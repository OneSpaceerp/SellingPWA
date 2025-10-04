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

const getAuthHeaders = (): HeadersInit => {
  const user = getLoggedInUser();
  if (!user) {
    console.log('No logged in user found');
    return {};
  }
  
  console.log('Getting auth headers for user:', user);
  
  // For ERPNext, we can use API key authentication or session-based auth
  // Since we're using credentials: 'include', the session should be maintained
  // But let's also try to get any stored API key
  const apiKey = localStorage.getItem('erpnext-api-key');
  
  if (apiKey) {
    console.log('Using API key authentication');
    return {
      'Authorization': `token ${apiKey}`,
    };
  }
  
  // If no API key, rely on session cookies (credentials: 'include')
  console.log('Using session-based authentication (cookies)');
  return {};
};

export const authService = {
  login,
  logout,
  isAuthenticated,
  getLoggedInUser,
  getAuthHeaders,
};

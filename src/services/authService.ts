const login = async (usr: string, pwd: string): Promise<{ success: boolean; user?: string; error?: string }> => {
  try {
    const response = await fetch(`/api/method/login`, {
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
  return {};
};

export const authService = {
  login,
  logout,
  isAuthenticated,
  getLoggedInUser,
  getAuthHeaders,
};

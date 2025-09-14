const login = async (usr: string, pwd: string): Promise<{ success: boolean; user?: string }> => {
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
      const data = await response.json();
      sessionStorage.setItem('erpnext-user', data.user_id);
      return { success: true, user: data.user_id };
    } else {
      console.error('Login failed:', response.status, await response.text());
      return { success: false };
    }
  } catch (error) {
    console.error('An error occurred during the login API call:', error);
    return { success: false };
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

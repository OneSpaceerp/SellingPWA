const login = async (apiKey: string, apiSecret: string): Promise<{ success: boolean; user?: string }> => {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  if (!erpNextUrl) {
    console.error("Login attempt failed: ERPNext URL is not set.");
    return { success: false };
  }

  try {
    const response = await fetch(`${erpNextUrl}/api/method/frappe.auth.get_logged_user`, {
      headers: {
        'Authorization': `token ${apiKey}:${apiSecret}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const token = `${apiKey}:${apiSecret}`;
      sessionStorage.setItem('erpnext-token', token);
      sessionStorage.setItem('erpnext-user', data.message);
      return { success: true, user: data.message };
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
  sessionStorage.removeItem('erpnext-token');
  sessionStorage.removeItem('erpnext-user');
  localStorage.removeItem('erpnext-pos-profile');
};

const isAuthenticated = (): boolean => {
  return sessionStorage.getItem('erpnext-token') !== null;
};

const getLoggedInUser = (): string | null => {
  return sessionStorage.getItem('erpnext-user');
};

const getAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem('erpnext-token');
  return token ? { 'Authorization': `token ${token}` } : {};
};

export const authService = {
  login,
  logout,
  isAuthenticated,
  getLoggedInUser,
  getAuthHeaders,
};

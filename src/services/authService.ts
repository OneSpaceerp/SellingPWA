// This service handles the logic for authenticating with the ERPNext API.

/**
 * Attempts to log in the user using an API Key and Secret.
 * On success, it stores the auth token in sessionStorage.
 * @param apiKey The user's API Key.
 * @param apiSecret The user's API Secret.
 * @returns An object indicating success and the logged-in user's email.
 */
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
      // The token is the combination of the key and secret, which is what ERPNext expects.
      const token = `${apiKey}:${apiSecret}`;
      sessionStorage.setItem('erpnext-token', token);
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

/**
 * Logs the user out by clearing session and local storage data.
 */
const logout = () => {
  sessionStorage.removeItem('erpnext-token');
  localStorage.removeItem('erpnext-pos-profile');
  // We can add more cleanup here as more data is stored.
};

/**
 * Checks if the user is currently authenticated.
 * @returns True if an auth token exists in sessionStorage.
 */
const isAuthenticated = (): boolean => {
  return sessionStorage.getItem('erpnext-token') !== null;
};

/**
 * Retrieves the authorization headers required for authenticated API calls.
 * @returns A HeadersInit object with the Authorization token.
 */
const getAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem('erpnext-token');
  return token ? { 'Authorization': `token ${token}` } : {};
};

export const authService = {
  login,
  logout,
  isAuthenticated,
  getAuthHeaders,
};

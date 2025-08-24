import React, { useState } from 'react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!apiKey || !apiSecret) {
      setError('API Key and Secret cannot be empty.');
      setLoading(false);
      return;
    }

    const result = await authService.login(apiKey, apiSecret);
    setLoading(false);

    if (result.success) {
      alert(`Login successful! Welcome, ${result.user}.`);
      // Reload the application to reflect the new authenticated state.
      // This will be replaced with a router-based navigation later.
      window.location.reload();
    } else {
      setError('Login failed. Please check your API Key and Secret and try again.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h1>Login to ERPNext</h1>
      <p>Please provide your API Key and API Secret to authenticate.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '5px' }}>API Key</label>
          <input
            id="apiKey"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API Key"
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="apiSecret" style={{ display: 'block', marginBottom: '5px' }}>API Secret</label>
          <input
            id="apiSecret"
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your API Secret"
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '10px 15px', fontSize: '16px', cursor: 'pointer' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

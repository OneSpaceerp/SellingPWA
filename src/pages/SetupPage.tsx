import React, { useState } from 'react';

export const SetupPage: React.FC = () => {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (url) {
      // A simple validation to ensure it looks like a URL.
      // A more robust validation can be added later.
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL including http:// or https://');
        return;
      }
      localStorage.setItem('erpnext-url', url);
      alert(`ERPNext URL saved: ${url}. The app will now reload.`);
      // Reload the page to reflect the change in the main App component.
      // This will be replaced by proper routing later.
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Connect to ERPNext</h1>
      <p>Please enter the URL of your ERPNext instance to begin.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g., https://my-erp.erpnext.com"
          style={{ width: '300px', padding: '8px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '8px 12px', marginLeft: '8px', fontSize: '16px' }}>
          Connect
        </button>
      </form>
    </div>
  );
};

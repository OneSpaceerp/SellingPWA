import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { SetupPage } from './pages/SetupPage';
import { LoginPage } from './pages/LoginPage';
import { PosProfileSelectionPage } from './pages/PosProfileSelectionPage';
import { authService } from './services/authService';
import { syncService } from './services/syncService';
import { db } from './db/db';
import { ItemList } from './components/ItemList';
import { CustomerList } from './components/CustomerList';
import './App.css';

function App() {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  const isAuthenticated = authService.isAuthenticated();
  const selectedProfile = localStorage.getItem('erpnext-pos-profile');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError('');
    try {
      await syncService.syncAllData();
      alert('Data synchronization completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during sync.';
      setSyncError(errorMessage);
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // State-based routing for setup and authentication
  if (!erpNextUrl) return <SetupPage />;
  if (!isAuthenticated) return <LoginPage />;
  if (!selectedProfile) return <PosProfileSelectionPage />;

  // Main application view once authenticated and configured
  return (
    <div className="App">
      <header className="App-header">
        <h1>PWA Sales App</h1>
        <div style={{ margin: '20px', padding: '15px', border: '1px solid #555', borderRadius: '8px', width: '80%' }}>
          <h3>Synchronization Control</h3>
          <button onClick={handleSync} disabled={isSyncing} style={{ padding: '10px 15px', fontSize: '16px' }}>
            {isSyncing ? 'Syncing...' : 'Sync All Data'}
          </button>
          {syncError && <p style={{ color: '#ff6666', fontSize: '0.9em' }}>Error: {syncError}</p>}
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', padding: '0 20px' }}>
        <div style={{ flex: 1, maxWidth: '500px' }}><ItemList /></div>
        <div style={{ flex: 1, maxWidth: '500px' }}><CustomerList /></div>
      </main>

      <footer style={{ marginTop: 'auto', padding: '20px', fontSize: '0.8em', color: '#ccc' }}>
        <p>Instance: {erpNextUrl} | POS Profile: {selectedProfile}</p>
        <button onClick={() => { authService.logout(); window.location.reload(); }} style={{ marginTop: '10px' }}>
          Logout & Reset
        </button>
      </footer>
    </div>
  );
}

export default App;

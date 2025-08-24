import { Title, Button, Box } from '@mantine/core';
import { useState } from 'react';
import { authService } from '../services/authService';
import { syncService } from '../services/syncService';

export function SettingsPage() {
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

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <>
      <Title order={1}>Settings</Title>

      <Box mt="xl">
        <Title order={3}>Data Synchronization</Title>
        <p>Pull the latest data from your ERPNext instance.</p>
        <Button onClick={handleSync} loading={isSyncing}>
          Sync All Data
        </Button>
        {syncError && <p style={{ color: 'red' }}>Error: {syncError}</p>}
      </Box>

      <Box mt="xl">
        <Title order={3}>Account</Title>
        <p>Log out of the application.</p>
        <Button color="red" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </>
  );
}

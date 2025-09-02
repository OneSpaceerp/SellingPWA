import { Title, Button, Box, Switch, useMantineColorScheme, Group } from '@mantine/core';
import { authService } from '../services/authService';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useSettingsStore } from '../store/settingsStore';

export function SettingsPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { loadSettings, isLoading } = useSettingsStore((state) => ({
    loadSettings: state.loadSettings,
    isLoading: state.isLoading,
  }));

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <>
      <Title order={1}>Settings</Title>

      <Box mt="xl">
        <Title order={3}>Theme</Title>
        <Group mt="xs">
          <IconSun size={18} />
          <Switch
            checked={colorScheme === 'dark'}
            onChange={(event) => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
            size="lg"
          />
          <IconMoon size={18} />
        </Group>
      </Box>

      <Box mt="xl">
        <Title order={3}>Sync All Data</Title>
        <p>Fetch latest Products, Customers and Settings from the server.</p>
        <Button onClick={() => loadSettings(true)} loading={isLoading}>
          Sync All Data
        </Button>
      </Box>

      <Box mt="xl">
        <Title order={3}>Account</Title>
        <p>Log out of the application and return to the login screen.</p>
        <Button color="red" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </>
  );
}

import { Title, Button, Box, Switch, useMantineColorScheme, Group } from '@mantine/core';
import { authService } from '../services/authService';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const handleLanguageChange = (checked: boolean) => {
    const language = checked ? 'ar' : 'en';
    i18n.changeLanguage(language);
  };

  return (
    <>
      <Title order={1}>{t('Settings')}</Title>

      <Box mt="xl">
        <Title order={3}>{t('Theme')}</Title>
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
        <Title order={3}>{t('Language')}</Title>
        <Group mt="xs">
          <span>{t('English')}</span>
          <Switch
            checked={i18n.language === 'ar'}
            onChange={(event) => handleLanguageChange(event.currentTarget.checked)}
            size="lg"
          />
          <span>{t('Arabic')}</span>
        </Group>
      </Box>

      <Box mt="xl">
        <Title order={3}>{t('Sync All Data')}</Title>
        <p>{t('Fetch latest Products, Customers and Settings from the server.')}</p>
        <Button onClick={() => loadSettings(true)} loading={isLoading}>
          {t('Sync All Data')}
        </Button>
      </Box>

      <Box mt="xl">
        <Title order={3}>{t('Account')}</Title>
        <p>{t('Log out of the application and return to the login screen.')}</p>
        <Button color="red" onClick={handleLogout}>
          {t('Logout')}
        </Button>
      </Box>
    </>
  );
}

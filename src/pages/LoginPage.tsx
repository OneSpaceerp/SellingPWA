import { useState } from 'react';
import { authService } from '../services/authService';
import { Title, TextInput, Button, Paper, Group, PasswordInput, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await authService.login(apiKey, apiSecret);
    setLoading(false);
    if (result.success) {
      window.location.reload();
    } else {
      setError('Login failed. Please check your API Key and Secret.');
    }
  };

  return (
    <Group justify="center" align="center" style={{ height: '100vh' }}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ width: '400px' }}>
        <Title order={2} mb="xl" ta="center">Login</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="API Key"
            placeholder="Enter your API Key"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
          />
          <PasswordInput
            label="API Secret"
            placeholder="Enter your API Secret"
            required
            mt="md"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            disabled={loading}
          />
          {error && (
            <Alert color="red" title="Login Error" icon={<IconAlertCircle />} mt="md">
              {error}
            </Alert>
          )}
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Login
          </Button>
        </form>
      </Paper>
    </Group>
  );
}

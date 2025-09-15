import { useState } from 'react';
import { authService } from '../services/authService';
import { Title, TextInput, Button, Paper, Group, PasswordInput, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await authService.login(email, password);
    setLoading(false);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || 'Login failed. Please check your Email and Password.');
    }
  };

  return (
    <Group justify="center" align="center" style={{ height: '100vh' }}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ width: '400px' }}>
        <Title order={2} mb="xl" ta="center">Login</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

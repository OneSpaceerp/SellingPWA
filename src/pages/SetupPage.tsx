import { useState } from 'react';
import { Title, TextInput, Button, Paper, Center } from '@mantine/core';

export function SetupPage() {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL including http:// or https://');
        return;
      }
      localStorage.setItem('erpnext-url', url);
      window.location.reload();
    }
  };

  return (
    <Center h="100vh">
      <Paper withBorder shadow="md" p={30} mt={30} radius="md" w={400}>
        <Title order={2} mb="xl" ta="center">Connect to ERPNext</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="ERPNext Instance URL"
            placeholder="e.g., https://my-erp.erpnext.com"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button fullWidth mt="xl" type="submit">
            Connect
          </Button>
        </form>
      </Paper>
    </Center>
  );
}

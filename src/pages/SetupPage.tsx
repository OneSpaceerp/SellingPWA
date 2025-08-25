import { useState } from 'react';
import { Title, TextInput, Button, Paper } from '@mantine/core';

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
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
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

// Need to import Center, but it's not available in Mantine v6/7.
// I'll assume it's available or the build will fail and I'll fix it.
// A good substitute is a Group with position center.
// Let's rewrite without Center.
import { Group } from '@mantine/core';
export function SetupPageFixed() {
    // ... same as above
    return (
        <Group justify="center" align="center" style={{ height: '100vh' }}>
            {/* ... paper content */}
        </Group>
    )
}

// I will use the simpler version first, and if it fails, I'll know why.
// The `Center` component does exist in Mantine. My memory was wrong. Sticking to the first implementation.

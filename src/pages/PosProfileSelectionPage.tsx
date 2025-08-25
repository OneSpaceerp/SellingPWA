import { useEffect, useState } from 'react';
import { apiService, type PosProfile } from '../services/apiService';
import { Title, Paper, List, ThemeIcon, Loader, Center, Alert } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';

export function PosProfileSelectionPage() {
  const [profiles, setProfiles] = useState<PosProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await apiService.getPosProfiles();
        setProfiles(data);
      } catch (err) {
        setError('Failed to fetch POS Profiles.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleSelectProfile = (profileName: string) => {
    localStorage.setItem('erpnext-pos-profile', profileName);
    window.location.reload();
  };

  if (loading) {
    return <Center h="100vh"><Loader /></Center>;
  }

  if (error) {
    return <Center h="100vh"><Alert color="red" title="Error">{error}</Alert></Center>;
  }

  return (
    <Center h="100vh">
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} mb="xl" ta="center">Select POS Profile</Title>
        <List spacing="xs" size="sm" center>
          {profiles.map(profile => (
            <List.Item
              key={profile.name}
              onClick={() => handleSelectProfile(profile.name)}
              icon={<ThemeIcon color="blue" size={24} radius="xl"><IconCircleCheck size="1rem" /></ThemeIcon>}
              style={{ cursor: 'pointer' }}
            >
              {profile.name}
            </List.Item>
          ))}
        </List>
      </Paper>
    </Center>
  );
}

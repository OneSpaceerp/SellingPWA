import { AppShell, Burger, Group, Tabs, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconShoppingCart, IconSettings, IconListDetails } from '@tabler/icons-react';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  // The value of the Tabs component will be the current path
  const activeTab = location.pathname;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: '100%',
        breakpoint: 'sm',
        collapsed: { mobile: false, desktop: true },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>PWA Sales App</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {/* This Outlet renders the content of the current matched route */}
        <Outlet />
      </AppShell.Main>

      {/* This will act as our bottom tab bar on mobile */}
      <AppShell.Navbar p="md">
        <Tabs value={activeTab} onChange={(value) => navigate(value || '/')}>
          <Tabs.List grow>
            <Tabs.Tab value="/" leftSection={<IconListDetails size="1.2rem" />}>
              Catalog
            </Tabs.Tab>
            <Tabs.Tab value="/cart" leftSection={<IconShoppingCart size="1.2rem" />}>
              Cart
            </Tabs.Tab>
            <Tabs.Tab value="/settings" leftSection={<IconSettings size="1.2rem" />}>
              Settings
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </AppShell.Navbar>
    </AppShell>
  );
}

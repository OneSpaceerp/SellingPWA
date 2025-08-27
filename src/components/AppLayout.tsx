import { AppShell, Group, Tabs, Title } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconShoppingCart, IconSettings, IconListDetails, IconReceipt } from '@tabler/icons-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname;

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>ERPNext Selling App</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Tabs value={activeTab} onChange={(value) => navigate(value || '/')}>
          <Tabs.List grow>
            <Tabs.Tab value="/" leftSection={<IconListDetails size="1.2rem" />}>
              Catalog
            </Tabs.Tab>
            <Tabs.Tab value="/cart" leftSection={<IconShoppingCart size="1.2rem" />}>
              Cart
            </Tabs.Tab>
            <Tabs.Tab value="/orders" leftSection={<IconReceipt size="1.2rem" />}>
              Orders
            </Tabs.Tab>
            <Tabs.Tab value="/settings" leftSection={<IconSettings size="1.2rem" />}>
              Settings
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </AppShell.Footer>
    </AppShell>
  );
}

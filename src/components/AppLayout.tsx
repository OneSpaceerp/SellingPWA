import { AppShell, Group, Tabs, Title } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconHome, IconShoppingCart, IconSettings, IconListDetails, IconReceipt } from '@tabler/icons-react';

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
            <Tabs.Tab value="/">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconHome size="1.2rem" />
                Home
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/catalog">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconListDetails size="1.2rem" />
                Catalog
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/cart">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconShoppingCart size="1.2rem" />
                Cart
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/orders">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconReceipt size="1.2rem" />
                Orders
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/settings">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconSettings size="1.2rem" />
                Settings
              </div>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </AppShell.Footer>
    </AppShell>
  );
}

import { AppShell, Group, Tabs, Title } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconShoppingCart, IconSettings, IconListDetails } from '@tabler/icons-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // The value of the Tabs component will be the current path, which ensures the correct tab is highlighted.
  const activeTab = location.pathname;

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          {/* The Burger menu has been removed for a simpler, mobile-first bottom tab navigation */}
          <Title order={3}>ERPNext Selling App</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {/* This Outlet renders the content of the currently matched route (e.g., CatalogPage, CartPage) */}
        <Outlet />
      </AppShell.Main>

      {/* Using AppShell.Footer creates a persistent bottom bar, which is ideal for mobile navigation. */}
      <AppShell.Footer p="md">
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
      </AppShell.Footer>
    </AppShell>
  );
}

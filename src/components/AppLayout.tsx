import { AppShell, Group, Tabs, Title } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconHome, IconShoppingCart, IconSettings, IconListDetails, IconReceipt, IconCalendar } from '@tabler/icons-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Map pathname to active tab, handling sub-routes
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/') && path !== '/catalog' && path !== '/cart' && path !== '/orders' && path !== '/service-plan' && path !== '/settings') {
      // Handle sub-routes - check if it's a service plan related route
      if (path.startsWith('/service-plan') || path.startsWith('/new-visit')) {
        return '/service-plan';
      }
      // For other routes, return the base path or default to home
      const basePaths = ['/catalog', '/cart', '/orders', '/settings'];
      const matchedBase = basePaths.find(base => path.startsWith(base));
      return matchedBase || '/';
    }
    return path;
  };

  const activeTab = getActiveTab();

  return (
      <AppShell
        header={{ height: 70 }}
        footer={{ height: 80 }}
        padding={0}
        style={{ margin: 0, padding: 0, position: 'relative' }}
      >
      <AppShell.Header style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <Group h="100%" justify="space-between" style={{ padding: '0 16px' }}>
          <Group gap="sm" align="center">
            <div style={{
              width: '28px',
              height: '28px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              NS
            </div>
            <Title order={3} c="white" style={{ fontWeight: '700', margin: 0 }}>
              Nest Selling
            </Title>
          </Group>
        </Group>
      </AppShell.Header>

        <AppShell.Main style={{ 
          paddingTop: '70px', 
          paddingBottom: '80px', 
          minHeight: '100vh',
          margin: 0,
          paddingLeft: 0,
          paddingRight: 0,
          width: '100%',
          position: 'relative',
          overflow: 'auto'
        }}>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        background: 'white',
        borderTop: '1px solid #e9ecef',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        padding: '8px 16px'
      }}>
        <Tabs value={activeTab} onChange={(value) => navigate(value || '/')}>
          <Tabs.List grow>
            <Tabs.Tab value="/">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <IconHome size="1.2rem" />
                <span style={{ fontSize: '0.75rem' }}>Home</span>
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/catalog">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <IconListDetails size="1.2rem" />
                <span style={{ fontSize: '0.75rem' }}>Catalog</span>
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/cart">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <IconShoppingCart size="1.2rem" />
                <span style={{ fontSize: '0.75rem' }}>Cart</span>
              </div>
            </Tabs.Tab>
                        <Tabs.Tab value="/orders">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>                                                      
                <IconReceipt size="1.2rem" />
                <span style={{ fontSize: '0.75rem' }}>Orders</span>
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/service-plan">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>                                                      
                <IconCalendar size="1.2rem" />
                <span style={{ fontSize: '0.75rem' }}>Visits</span>
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="/settings">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>                                                      
                <IconSettings size="1.2rem" />
                <span style={{ fontSize: '0.75rem' }}>Settings</span>
              </div>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </AppShell.Footer>
    </AppShell>
  );
}

import { AppShell, Group, Tabs, Title, Image } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconHome, IconShoppingCart, IconSettings, IconListDetails, IconReceipt } from '@tabler/icons-react';
import NestSDLogo from '../assets/NestSD.svg';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname;

  return (
    <AppShell
      header={{ height: 70 }}
      footer={{ height: 80 }}
      padding={0}
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
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Image 
              src={NestSDLogo} 
              alt="NestSD Logo" 
              width={40} 
              height={40}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <Title order={3} c="white" style={{ fontWeight: '700' }}>
              Nest Selling
            </Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ 
        paddingTop: '70px', 
        paddingBottom: '80px',
        minHeight: '100vh'
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

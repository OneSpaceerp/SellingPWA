import { useState, useEffect } from 'react';
import { Title, Card, Text, Group, SimpleGrid, Loader, Center, Badge } from '@mantine/core';
import { apiService, type SalesOrder } from '../services/apiService';
import { authService } from '../services/authService';
import { IconTrendingUp, IconShoppingCart, IconUsers, IconCurrencyDollar } from '@tabler/icons-react';

export function DashboardPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const user = authService.getLoggedInUser();
      if (user) {
        try {
          const data = await apiService.getSalesOrders(user);
          const sortedOrders = data.sort((a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime());
          setOrders(sortedOrders.slice(0, 5));
        } catch (err) {
          setError('Failed to fetch orders.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const renderOrders = () => {
    if (isLoading) {
      return (
        <Center style={{ height: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md" c="dimmed">Loading recent orders...</Text>
          </div>
        </Center>
      );
    }
    if (error) {
      return (
        <Card style={{ 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '40px'
        }}>
          <Text size="lg" fw={600}>❌ Error Loading Orders</Text>
          <Text mt="xs" c="rgba(255,255,255,0.8)">{error}</Text>
        </Card>
      );
    }
    if (orders.length === 0) {
      return (
        <Card style={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          textAlign: 'center',
          padding: '40px',
          border: '2px dashed #dee2e6'
        }}>
          <Text size="xl" mb="md">📋</Text>
          <Text size="lg" fw={500} c="dimmed">No recent orders found</Text>
          <Text size="sm" c="dimmed" mt="xs">Start by creating your first order</Text>
        </Card>
      );
    }
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {orders.map((order, _) => (
          <Card 
            key={order.name} 
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            {/* Header with gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              margin: '-16px -16px 16px -16px',
              padding: '16px',
              color: 'white',
              borderRadius: '12px 12px 0 0'
            }}>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="lg" c="white">{order.name}</Text>
                <Badge 
                  color={order.docstatus === 1 ? 'green' : order.docstatus === 0 ? 'yellow' : 'red'}
                  style={{ background: order.docstatus === 1 ? '#28a745' : order.docstatus === 0 ? '#ffc107' : '#dc3545' }}
                >
                  {order.docstatus === 1 ? 'Approved' : order.docstatus === 0 ? 'Draft' : 'Cancelled'}
                </Badge>
              </Group>
              <Text size="sm" c="rgba(255,255,255,0.8)">
                {new Date(order.creation).toLocaleDateString()}
              </Text>
            </div>

            {/* Order Details */}
            <div style={{ marginBottom: '16px' }}>
              <Text size="sm" c="dimmed" mb="xs" fw={500}>Customer</Text>
              <Text size="md" fw={500} style={{ color: '#495057' }}>
                {order.customer_name || order.customer}
              </Text>
            </div>

            {/* Financial Summary */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #e9ecef'
            }}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed" fw={500}>Total Amount</Text>
                <Text size="lg" fw={700} style={{ 
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  EGP {order.grand_total.toFixed(2)}
                </Text>
              </Group>
            </div>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  // Calculate dashboard statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.grand_total, 0);
  const approvedOrders = orders.filter(order => order.docstatus === 1).length;
  const pendingOrders = orders.filter(order => order.docstatus === 0).length;

  return (
    <div style={{
      background: '#f8f9fa',
      minHeight: '100vh',
      padding: '0',
      width: '100%',
      margin: 0,
      position: 'relative'
    }}>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        width: '100%',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Title order={1} c="white" mb="xs" style={{ fontSize: '2rem', fontWeight: '700' }}>
              📊 Dashboard
            </Title>
            <Text size="lg" c="rgba(255,255,255,0.8)" style={{ fontWeight: '400' }}>
              Welcome back! Here's your business overview
            </Text>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <Text size="sm" c="white" fw={500}>Total Orders</Text>
            <Text size="xl" c="white" fw={700}>{totalOrders}</Text>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl" style={{ margin: '0.06rem', padding: '0.06rem' }}>
        <Card style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconShoppingCart size={24} />
            </div>
            <div>
              <Text size="sm" c="rgba(255,255,255,0.8)" fw={500}>Total Orders</Text>
              <Text size="xl" fw={700}>{totalOrders}</Text>
            </div>
          </div>
        </Card>

        <Card style={{
          background: 'linear-gradient(135deg, #007bff 0%, #6f42c1 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconCurrencyDollar size={24} />
            </div>
            <div>
              <Text size="sm" c="rgba(255,255,255,0.8)" fw={500}>Total Revenue</Text>
              <Text size="xl" fw={700}>EGP {totalRevenue.toFixed(2)}</Text>
            </div>
          </div>
        </Card>

        <Card style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconTrendingUp size={24} />
            </div>
            <div>
              <Text size="sm" c="rgba(255,255,255,0.8)" fw={500}>Approved</Text>
              <Text size="xl" fw={700}>{approvedOrders}</Text>
            </div>
          </div>
        </Card>

        <Card style={{
          background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconUsers size={24} />
            </div>
            <div>
              <Text size="sm" c="rgba(255,255,255,0.8)" fw={500}>Pending</Text>
              <Text size="xl" fw={700}>{pendingOrders}</Text>
            </div>
          </div>
        </Card>
      </SimpleGrid>

      {/* Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        margin: '0.06rem',
        width: 'calc(100% - 0.12rem)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <Title order={2} style={{ color: '#495057', margin: 0 }}>📋 Recent Orders</Title>
        </div>
        {renderOrders()}
      </div>

      {/* Selling Plan Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginTop: '32px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <Title order={2} style={{ color: '#495057', margin: 0 }}>🎯 Selling Plan</Title>
        </div>
        <Card style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '2px dashed #dee2e6',
          textAlign: 'center',
          padding: '40px'
        }}>
          <Text size="xl" mb="md">🚀</Text>
          <Text size="lg" fw={500} c="dimmed" mb="xs">Selling Plan Coming Soon</Text>
          <Text size="sm" c="dimmed">Advanced analytics and planning features will be available here</Text>
        </Card>
      </div>
    </div>
  );
}

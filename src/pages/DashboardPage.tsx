import { useState, useEffect } from 'react';
import { Title, Card, Text, Group, SimpleGrid, Loader, Center } from '@mantine/core';
import { apiService, type SalesOrder } from '../services/apiService';
import { authService } from '../services/authService';

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
      return <Center><Loader /></Center>;
    }
    if (error) {
      return <Text color="red">{error}</Text>;
    }
    if (orders.length === 0) {
      return <Text>No recent orders found.</Text>;
    }
    return (
      <SimpleGrid cols={1}>
        {orders.map((order) => (
          <Card key={order.name} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Text fw={500}>{order.name}</Text>
              <Text size="sm">{new Date(order.creation).toLocaleDateString()}</Text>
            </Group>
            <Text size="sm" c="dimmed">Customer: {order.customer_name}</Text>
            <Text size="sm" c="dimmed">Total: {order.grand_total}</Text>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <div>
      <Title order={1} mb="xl">Dashboard</Title>

      <Title order={2} mb="md">Last 5 Orders</Title>
      {renderOrders()}

      <Title order={2} mt="xl" mb="md">Selling Plan</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text>This is a placeholder for the Selling plan content.</Text>
      </Card>
    </div>
  );
}

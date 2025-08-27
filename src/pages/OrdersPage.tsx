import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { authService } from '../services/authService';
import { useSettingsStore } from '../store/settingsStore';
import { Title, TextInput, SimpleGrid, Card, Text, Group, rem, Center, Loader, Badge, Divider, Modal, Button, Table, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch } from '@tabler/icons-react';
import type { Order } from '../db/Order';
import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const currency = useSettingsStore((state) => state.currency);
  const user = authService.getLoggedInUser();
  const navigate = useNavigate();

  const orders = useLiveQuery(async () => {
    if (!user) return [];

    let filteredOrders = await db.orders.where('created_by').equals(user).toArray();

    if (customerFilter) {
      filteredOrders = filteredOrders.filter(order =>
        order.customer.toLowerCase().includes(customerFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      filteredOrders = filteredOrders.filter(order =>
        order.created_at >= startOfDay && order.created_at <= endOfDay
      );
    }

    return filteredOrders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }, [customerFilter, dateFilter]);

  const handleCompletePayment = () => {
    if (selectedOrder) {
      // For now, we just close the modal and navigate to a placeholder route.
      // A more complete implementation would pass the order details to the payment page.
      setSelectedOrder(null);
      navigate(`/payment/${selectedOrder.order_id}`);
    }
  };

  const renderContent = () => {
    if (orders === undefined) {
      return <Center style={{ height: '50vh' }}><Loader data-testid="orders-loader" /></Center>;
    }
    if (orders.length === 0) {
      return <Center style={{ height: '50vh' }}><Text>No orders found.</Text></Center>;
    }
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'md', sm: 'xl' }}>
        {orders.map((order: Order) => (
          <Card shadow="sm" padding="lg" radius="md" withBorder key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
            <Group justify="space-between">
              <Text fw={500} size="lg">{order.order_id}</Text>
              <Badge color={order.outstanding_amount > 0 ? 'orange' : 'green'}>
                {order.outstanding_amount > 0 ? 'Partially Paid' : 'Paid'}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">{order.customer}</Text>
            <Text size="xs" c="dimmed" mt="xs">{new Date(order.created_at).toLocaleString()}</Text>

            <Divider my="sm" />

            <Group justify="space-between" mt="md">
              <Text>Grand Total:</Text>
              <Text fw={700}>{currency} {order.grand_total.toFixed(2)}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Paid Amount:</Text>
              <Text c="teal">{currency} {order.paid_amount.toFixed(2)}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Outstanding:</Text>
              <Text c="orange">{currency} {order.outstanding_amount.toFixed(2)}</Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <>
      <Title order={1} mb="md">My Orders</Title>
      <Group grow mb="xl">
        <TextInput
          placeholder="Filter by customer name..."
          leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
          value={customerFilter}
          onChange={(event) => setCustomerFilter(event.currentTarget.value)}
        />
        <DatePickerInput
          placeholder="Filter by date"
          value={dateFilter}
          onChange={(value: Date | null) => setDateFilter(value)}
          clearable
        />
      </Group>
      {renderContent()}

      <Modal
        opened={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={`Order: ${selectedOrder?.order_id}`}
        size="lg"
      >
        {selectedOrder && (
          <>
            <Stack>
              <Group justify="space-between">
                <Text>Customer:</Text>
                <Text fw={500}>{selectedOrder.customer}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Date:</Text>
                <Text>{new Date(selectedOrder.created_at).toLocaleString()}</Text>
              </Group>
            </Stack>

            <Divider my="sm" />

            <Title order={4} mb="sm">Items</Title>
            <Table striped withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Item</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedOrder.items.map(item => (
                  <Table.Tr key={item.item_code}>
                    <Table.Td>{item.item_name}</Table.Td>
                    <Table.Td>{item.qty}</Table.Td>
                    <Table.Td>{currency} {item.rate.toFixed(2)}</Table.Td>
                    <Table.Td>{currency} {(item.qty * item.rate).toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Divider my="sm" />

            <Stack>
              <Group justify="space-between">
                <Text>Grand Total:</Text>
                <Text fw={700}>{currency} {selectedOrder.grand_total.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Paid Amount:</Text>
                <Text c="teal">{currency} {selectedOrder.paid_amount.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Outstanding:</Text>
                <Text c="orange">{currency} {selectedOrder.outstanding_amount.toFixed(2)}</Text>
              </Group>
            </Stack>

            <Group justify="flex-end" mt="xl">
              {selectedOrder.outstanding_amount > 0 && (
                <Button color="green" onClick={handleCompletePayment}>Complete Payment</Button>
              )}
            </Group>
          </>
        )}
      </Modal>
    </>
  );
}

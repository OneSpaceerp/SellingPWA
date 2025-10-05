import { useState, useRef, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiService, type SalesOrder } from '../services/apiService';
import { useSettingsStore } from '../store/settingsStore';
import { Title, TextInput, SimpleGrid, Card, Text, Group, rem, Center, Loader, Badge, Divider, Modal, Button, Table, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconPrinter, IconCreditCard } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPrintLayout } from '../components/OrderPrintLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [detailedOrder, setDetailedOrder] = useState<SalesOrder | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currency = useSettingsStore((state) => state.currency);
  const user = authService.getLoggedInUser();
  const navigate = useNavigate();

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  } as any);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      apiService.getSalesOrders(user)
        .then(data => {
          setOrders(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    if (selectedOrder) {
      console.log('OrdersPage: Starting to fetch details for order:', selectedOrder.name);
      setIsDetailLoading(true);
      setDetailedOrder(null); // Clear previous details
      apiService.getSalesOrder(selectedOrder.name)
        .then(data => {
          console.log('OrdersPage: Successfully fetched order details:', data);
          setDetailedOrder(data);
          setIsDetailLoading(false);
        })
        .catch(err => {
          console.error('OrdersPage: Failed to fetch order details:', err);
          setIsDetailLoading(false);
          // Show error notification
          notifications.show({
            color: 'red',
            title: 'Failed to load order details',
            message: `Could not load details for order ${selectedOrder.name}. Please try again.`,
          });
          // Close the modal to prevent shadow screen
          setSelectedOrder(null);
        });
    }
  }, [selectedOrder]);

  // Debug modal state changes
  useEffect(() => {
    if (selectedOrder) {
      console.log('OrdersPage: Modal state - selectedOrder:', selectedOrder.name, 'isDetailLoading:', isDetailLoading, 'detailedOrder:', detailedOrder ? 'loaded' : 'not loaded');
    }
  }, [selectedOrder, isDetailLoading, detailedOrder]);

  const handleCompletePayment = () => {
    if (detailedOrder) {
      const orderName = detailedOrder.name;
      setSelectedOrder(null);
      setDetailedOrder(null);
      // Add a delay to allow the modal to close before navigating
      setTimeout(() => navigate(`/payment/${orderName}`), 300);
    }
  };

  const getStatusText = (status: number) => {
    if (status === 0) return 'Pending Approval';
    if (status === 1) return 'Approved';
    if (status === 2) return 'Cancelled';
    return 'Unknown';
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return 'yellow';
    if (status === 1) return 'green';
    if (status === 2) return 'red';
    return 'gray';
  };

  const filteredOrders = orders
    .filter(order => {
      if (!customerFilter) return true;
      return order.customer_name?.toLowerCase().includes(customerFilter.toLowerCase()) ||
             order.customer.toLowerCase().includes(customerFilter.toLowerCase());
    })
    .filter(order => {
      if (!dateFilter) return true;
      const orderDate = new Date(order.creation);
      return orderDate.toDateString() === dateFilter.toDateString();
    })
    .sort((a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime());

  const renderContent = () => {
    if (isLoading) {
      return <Center style={{ height: '50vh' }}><Loader data-testid="orders-loader" /></Center>;
    }
    if (filteredOrders.length === 0) {
      return <Center style={{ height: '50vh' }}><Text>No orders found.</Text></Center>;
    }
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'md', sm: 'xl' }}>
        {filteredOrders.map((order: SalesOrder) => (
          <Card shadow="sm" padding="lg" radius="md" withBorder key={order.name} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
            <Group justify="space-between">
              <Text fw={500} size="lg">{order.name}</Text>
              <Group gap="xs">
                {order.docstatus === 1 && (
                  <Badge color="blue" leftSection={<IconCreditCard size={12} />}>
                    Payment Ready
                  </Badge>
                )}
                <Badge color={getStatusColor(order.docstatus)}>
                  {getStatusText(order.docstatus)}
                </Badge>
              </Group>
            </Group>
            <Text size="sm" c="dimmed">{order.customer_name || order.customer}</Text>
            <Text size="xs" c="dimmed" mt="xs">{new Date(order.creation).toLocaleString()}</Text>

            <Divider my="sm" />

            <Group justify="space-between" mt="md">
              <Text>Grand Total:</Text>
              <Text fw={700}>{currency} {order.grand_total.toFixed(2)}</Text>
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
        <TextInput
          type="date"
          placeholder="Filter by date"
          value={dateFilter ? dateFilter.toISOString().split('T')[0] : ''}
          onChange={(event) => setDateFilter(event.currentTarget.value ? new Date(event.currentTarget.value) : null)}
        />
      </Group>
      {renderContent()}

      <Modal
        opened={selectedOrder !== null}
        onClose={() => {
          setSelectedOrder(null);
          setDetailedOrder(null);
        }}
        title={`Order: ${selectedOrder?.name}`}
        size="lg"
      >
        <ErrorBoundary>
          {isDetailLoading && <Center><Loader /></Center>}
          {!isDetailLoading && detailedOrder && (
            <>
              <Stack>
                <Group justify="space-between">
                <Text>Customer:</Text>
                <Text fw={500}>{detailedOrder.customer_name || detailedOrder.customer}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Status:</Text>
                <Badge color={getStatusColor(detailedOrder.docstatus)}>{getStatusText(detailedOrder.docstatus)}</Badge>
              </Group>
              <Group justify="space-between">
                <Text>Date:</Text>
                <Text>{new Date(detailedOrder.creation).toLocaleString()}</Text>
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
                {detailedOrder.items && detailedOrder.items.map(item => (
                  <Table.Tr key={item.item_code}>
                    <Table.Td>{item.item_name}</Table.Td>
                    <Table.Td>{item.qty || 0}</Table.Td>
                    <Table.Td>{currency} {(item.rate || 0).toFixed(2)}</Table.Td>
                    <Table.Td>{currency} {((item.qty || 0) * (item.rate || 0)).toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Divider my="sm" />

            <Stack>
              <Group justify="space-between">
                <Text>Grand Total:</Text>
                <Text fw={700}>{currency} {detailedOrder.grand_total.toFixed(2)}</Text>
              </Group>
              {detailedOrder.outstanding_amount !== undefined && (
                <Group justify="space-between">
                  <Text c="orange">Outstanding Amount:</Text>
                  <Text c="orange" fw={700}>{currency} {(detailedOrder.outstanding_amount || 0).toFixed(2)}</Text>
                </Group>
              )}
            </Stack>

            <Group justify="flex-end" mt="xl">
              <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint}>Print</Button>
              {detailedOrder.docstatus === 1 && (detailedOrder.outstanding_amount || 0) > 0 && (
                <Button color="green" onClick={handleCompletePayment}>Collect Payment</Button>
              )}
            </Group>
          </>
        )}
        {!isDetailLoading && !detailedOrder && (
          <Center style={{ height: '200px' }}>
            <Text c="dimmed">No order details available</Text>
          </Center>
        )}
        </ErrorBoundary>
      </Modal>

      <div style={{ display: 'none' }}>
        {detailedOrder && <OrderPrintLayout ref={printRef} order={detailedOrder} currency={currency} />}
      </div>
    </>
  );
}

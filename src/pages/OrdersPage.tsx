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
          console.log('OrdersPage: Order data structure:', {
            name: data?.name,
            customer: data?.customer,
            customer_name: data?.customer_name,
            docstatus: data?.docstatus,
            grand_total: data?.grand_total,
            outstanding_amount: data?.outstanding_amount,
            items: data?.items,
            hasItems: !!data?.items,
            itemsLength: data?.items?.length
          });
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

      {/* Temporary HTML Modal to test if Mantine Modal is the issue */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            color: 'black',
            position: 'relative',
            zIndex: 1001,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'black' }}>Order: {selectedOrder.name}</h2>
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setDetailedOrder(null);
                }}
                style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
            
            <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
              🚨 HTML MODAL IS WORKING! 🚨
              <br />
              Order: {selectedOrder.name}
              <br />
              Loading: {isDetailLoading ? 'YES' : 'NO'}
              <br />
              Has Data: {detailedOrder ? 'YES' : 'NO'}
            </div>

            {isDetailLoading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                Loading order details...
              </div>
            )}

            {!isDetailLoading && detailedOrder && (
              <div>
                <div style={{ backgroundColor: 'green', color: 'white', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
                  ✅ Order Details Loaded Successfully!
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <strong>Customer:</strong> {detailedOrder.customer_name || detailedOrder.customer}<br />
                  <strong>Status:</strong> {getStatusText(detailedOrder.docstatus)}<br />
                  <strong>Date:</strong> {new Date(detailedOrder.creation).toLocaleString()}<br />
                  <strong>Grand Total:</strong> {currency} {detailedOrder.grand_total.toFixed(2)}<br />
                  {detailedOrder.outstanding_amount !== undefined && (
                    <>
                      <strong>Outstanding Amount:</strong> {currency} {(detailedOrder.outstanding_amount || 0).toFixed(2)}<br />
                    </>
                  )}
                </div>

                {detailedOrder.items && detailedOrder.items.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3>Items:</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ border: '1px solid #ccc', padding: '8px' }}>Item</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px' }}>Qty</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rate</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedOrder.items.map(item => (
                          <tr key={item.item_code}>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.item_name}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.qty || 0}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{currency} {(item.rate || 0).toFixed(2)}</td>
                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{currency} {((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handlePrint}
                    style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Print
                  </button>
                  {detailedOrder.docstatus === 1 && (detailedOrder.outstanding_amount || 0) > 0 && (
                    <button 
                      onClick={handleCompletePayment}
                      style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Collect Payment
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isDetailLoading && !detailedOrder && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                ❌ No order details available
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        {detailedOrder && <OrderPrintLayout ref={printRef} order={detailedOrder} currency={currency} />}
      </div>
    </>
  );
}

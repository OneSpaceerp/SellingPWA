import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiService, type SalesOrder } from '../services/apiService';
import { useSettingsStore } from '../store/settingsStore';
import { Title, TextInput, SimpleGrid, Card, Text, Group, rem, Center, Loader, Badge, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconCreditCard } from '@tabler/icons-react';

export function OrdersPage() {
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [detailedOrder, setDetailedOrder] = useState<SalesOrder | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [modeOfPayments, setModeOfPayments] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const currency = useSettingsStore((state) => state.currency);
  const user = authService.getLoggedInUser();


  const handlePrint = () => {
    console.log('Starting print process...');
    
    if (!detailedOrder) {
      console.error('No order data available for printing');
      return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      console.error('Could not open print window');
      return;
    }
    
    // Create the print content HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${detailedOrder.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
            .status.approved { background-color: #28a745; }
            .status.fully-paid { background-color: #28a745; }
            .status.partially-paid { background-color: #007bff; }
            .status.not-paid { background-color: #dc3545; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Order</h1>
            <h2>${detailedOrder.name}</h2>
          </div>
          
          <div class="order-info">
            <p><strong>Customer:</strong> ${detailedOrder.customer_name || detailedOrder.customer}</p>
            <p><strong>Date:</strong> ${new Date(detailedOrder.creation).toLocaleString()}</p>
            <p><strong>Status:</strong> 
              <span class="status approved">Approved</span>
              <span class="status ${getPaymentStatus(detailedOrder).includes('Fully Paid') ? 'fully-paid' : 
                                   getPaymentStatus(detailedOrder).includes('Partially Paid') ? 'partially-paid' : 'not-paid'}">
                ${getPaymentStatus(detailedOrder)}
              </span>
            </p>
            <p><strong>Grand Total:</strong> ${currency} ${detailedOrder.grand_total.toFixed(2)}</p>
            <p><strong>Advance Paid:</strong> ${currency} {(detailedOrder.advance_paid || 0).toFixed(2)}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${detailedOrder.items ? detailedOrder.items.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.qty || 0}</td>
                  <td>${currency} ${(item.rate || 0).toFixed(2)}</td>
                  <td>${currency} ${((item.qty || 0) * (item.rate || 0)).toFixed(2)}</td>
                </tr>
              `).join('') : ''}
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Grand Total: ${currency} ${detailedOrder.grand_total.toFixed(2)}</strong></p>
            <p><strong>Advance Paid: ${currency} {(detailedOrder.advance_paid || 0).toFixed(2)}</strong></p>
            <p><strong>Outstanding: ${currency} {(detailedOrder.grand_total - (detailedOrder.advance_paid || 0)).toFixed(2)}</strong></p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      console.log('Print content loaded, opening print dialog...');
      printWindow.print();
      printWindow.close();
    };
  };

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
    // Load mode of payments and company name when component mounts
    Promise.all([
      apiService.getModeOfPayments(),
      apiService.getPosProfileDetails('POS')
    ])
    .then(([paymentsData, posProfileData]) => {
      setModeOfPayments(paymentsData);
      setCompanyName(posProfileData.company || 'Your Company');
      console.log('Company name from POS profile:', posProfileData.company);
    })
    .catch(err => {
      console.error('Failed to load initial data:', err);
      // Fallback to default company name
      setCompanyName('Your Company');
    });
  }, []);

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
      // Calculate remaining amount (grand total - advance paid)
      const remainingAmount = detailedOrder.grand_total - (detailedOrder.advance_paid || 0);
      setPaymentAmount(remainingAmount.toString());
      setShowPaymentForm(true);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!detailedOrder || !paymentAmount || !paymentMethod) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all payment details',
        color: 'red',
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Create payment entry
      const paymentPayload = {
        dt: 'Sales Order',
        dn: detailedOrder.name,
        party_type: 'Customer',
        party: detailedOrder.customer,
        paid_amount: parseFloat(paymentAmount),
        paid_to: paymentMethod === 'Cash' ? 'Cash' : 'Bank',
        mode_of_payment: paymentMethod,
        company: companyName, // Use actual company name from POS profile
        posting_date: new Date().toISOString().split('T')[0],
        // Only include reference fields for non-cash payments
        ...(paymentMethod !== 'Cash' && {
          reference_no: `PAY-${Date.now()}`,
          reference_date: new Date().toISOString().split('T')[0],
        }),
      };

      console.log('Creating payment entry:', paymentPayload);
      console.log('Payment method:', paymentMethod);
      console.log('Is cash payment:', paymentMethod === 'Cash');
      
      // Get company default accounts
      const defaultAccounts = await apiService.getDefaultAccounts(companyName);
      console.log('Default accounts for company:', companyName, defaultAccounts);

      // Create payment entry directly with proper allocation to Sales Order
      const paymentEntryDoc = {
        doctype: 'Payment Entry',
        payment_type: 'Receive',
        party_type: 'Customer',
        party: detailedOrder.customer,
        paid_amount: parseFloat(paymentAmount),
        received_amount: parseFloat(paymentAmount),
        paid_to: paymentMethod === 'Cash' ? defaultAccounts.cash : defaultAccounts.bank,
        paid_to_account: paymentMethod === 'Cash' ? defaultAccounts.cash : defaultAccounts.bank,
        mode_of_payment: paymentMethod,
        company: companyName,
        posting_date: new Date().toISOString().split('T')[0],
        reference_no: paymentMethod !== 'Cash' ? `PAY-${Date.now()}` : undefined,
        reference_date: paymentMethod !== 'Cash' ? new Date().toISOString().split('T')[0] : undefined,
        // Critical: Allocate payment to the specific Sales Order
        references: [{
          reference_doctype: 'Sales Order',
          reference_name: detailedOrder.name,
          allocated_amount: parseFloat(paymentAmount),
          outstanding_amount: parseFloat(paymentAmount) // This ensures proper allocation
        }]
      };

      console.log('Creating payment entry with allocation:', paymentEntryDoc);

      // Save the payment entry
      const savedPayment = await apiService.saveDoc(paymentEntryDoc);
      console.log('Payment entry saved:', savedPayment);

      // Submit the payment entry
      const submittedPayment = await apiService.submitDoc(savedPayment);
      console.log('Payment entry submitted:', submittedPayment);

      // Update the Sales Order to reflect the payment
      console.log('Updating Sales Order status...');
      try {
        // Get the updated Sales Order to check outstanding amount
        const updatedOrder = await apiService.getSalesOrder(detailedOrder.name);
        console.log('Updated order outstanding amount:', updatedOrder.outstanding_amount);
        
        // If outstanding amount is 0, update the order status
        if (updatedOrder.outstanding_amount === 0) {
          console.log('Order is fully paid, updating status...');
          // You might want to add a custom field or update the order status here
          // This depends on your ERPNext configuration
        }
      } catch (updateError) {
        console.warn('Could not update order status:', updateError);
        // Don't fail the payment if status update fails
      }

      notifications.show({
        title: 'Success',
        message: `Payment of ${currency} ${paymentAmount} collected successfully!`,
        color: 'green',
      });

      // Close the payment form and refresh orders
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentMethod('');
      
      // Refresh the current order details to show updated status
      console.log('Refreshing order details...');
      const refreshedOrder = await apiService.getSalesOrder(detailedOrder.name);
      setDetailedOrder(refreshedOrder);
      console.log('Refreshed order outstanding amount:', refreshedOrder.outstanding_amount);
      
      // Refresh the orders list
      if (user) {
        const updatedOrders = await apiService.getSalesOrders(user);
        setOrders(updatedOrders);
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to process payment. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('ValidationError')) {
          errorMessage = 'Payment validation failed. Please check your payment details.';
        } else if (error.message.includes('Reference No')) {
          errorMessage = 'Reference number is required for this payment method.';
        } else {
          errorMessage = error.message;
        }
      }
      
      notifications.show({
        title: 'Payment Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setPaymentAmount('');
    setPaymentMethod('');
  };

  const getStatusText = (status: number) => {
    if (status === 0) return 'Pending Approval';
    if (status === 1) return 'Approved';
    if (status === 2) return 'Cancelled';
    return 'Unknown';
  };

  const getPaymentStatus = (order: any) => {
    // ERPNext uses 'advance_paid' field for tracking payments
    const advancePaid = order.advance_paid || 0;
    const grandTotal = order.grand_total || 0;
    
    if (advancePaid >= grandTotal) {
      return '✅ Fully Paid';
    } else if (advancePaid > 0) {
      return `💰 Partially Paid (${currency} ${advancePaid.toFixed(2)} paid)`;
    } else {
      return '❌ Not Paid';
    }
  };


  const getOrderStatusBadges = (order: any) => {
    const badges = [];
    
    // Document status badge
    if (order.docstatus === 0) {
      badges.push({ text: 'PENDING APPROVAL', color: 'yellow' });
    } else if (order.docstatus === 1) {
      badges.push({ text: 'APPROVED', color: 'green' });
    } else if (order.docstatus === 2) {
      badges.push({ text: 'CANCELLED', color: 'red' });
    }
    
    // Payment status badge
    if (order.docstatus === 1) { // Only show payment status for approved orders
      const advancePaid = order.advance_paid || 0;
      const grandTotal = order.grand_total || 0;
      
      if (advancePaid >= grandTotal) {
        badges.push({ text: 'FULLY PAID', color: 'green' });
      } else if (advancePaid > 0) {
        badges.push({ text: 'PARTIALLY PAID', color: 'blue' });
      } else {
        badges.push({ text: 'PAYMENT READY', color: 'blue' });
      }
    }
    
    return badges;
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
                {getOrderStatusBadges(order).map((badge, index) => (
                  <Badge 
                    key={index}
                    color={badge.color === 'yellow' ? 'yellow' : 
                           badge.color === 'green' ? 'green' : 
                           badge.color === 'blue' ? 'blue' :
                           badge.color === 'red' ? 'red' : 'gray'}
                    leftSection={badge.text.includes('PAID') ? <IconCreditCard size={12} /> : undefined}
                  >
                    {badge.text}
              </Badge>
                ))}
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
                  setShowPaymentForm(false);
                  setPaymentAmount('');
                  setPaymentMethod('');
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
                  <strong>Payment Status:</strong> {getPaymentStatus(detailedOrder)}<br />
                  <strong>Date:</strong> {new Date(detailedOrder.creation).toLocaleString()}<br />
                  <strong>Grand Total:</strong> {currency} {detailedOrder.grand_total.toFixed(2)}<br />
                  <strong>Advance Paid:</strong> {currency} {(detailedOrder.advance_paid || 0).toFixed(2)}<br />
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

                {!showPaymentForm ? (
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handlePrint}
                      style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Print
                    </button>
                      {detailedOrder.docstatus === 1 && (detailedOrder.grand_total - (detailedOrder.advance_paid || 0)) > 0 && (
                        <button 
                          onClick={handleCompletePayment}
                          style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Collect Payment
                        </button>
                      )}
                  </div>
                ) : (
                  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'black' }}>💳 Collect Payment</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black' }}>
                        Payment Amount ({currency})
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          fontSize: '16px'
                        }}
                        placeholder="Enter payment amount"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black' }}>
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          fontSize: '16px'
                        }}
                      >
                        <option value="">Select payment method</option>
                        {modeOfPayments.map(method => (
                          <option key={method.name} value={method.name}>
                            {method.mode_of_payment || method.name}
                          </option>
                        ))}
                      </select>
                    </div>

                      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                        <strong>Order Total:</strong> {currency} {detailedOrder.grand_total.toFixed(2)}<br />
                        <strong>Already Paid:</strong> {currency} {(detailedOrder.advance_paid || 0).toFixed(2)}<br />
                        <strong>Remaining:</strong> {currency} {(detailedOrder.grand_total - (detailedOrder.advance_paid || 0)).toFixed(2)}<br />
                        <strong>Payment Amount:</strong> {currency} {paymentAmount || '0.00'}
                      </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={handleCancelPayment}
                        disabled={isProcessingPayment}
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: '#6c757d', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                          opacity: isProcessingPayment ? 0.6 : 1
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handlePaymentSubmit}
                        disabled={isProcessingPayment || !paymentAmount || !paymentMethod}
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: isProcessingPayment ? '#6c757d' : '#28a745', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                          opacity: isProcessingPayment ? 0.6 : 1
                        }}
                      >
                        {isProcessingPayment ? 'Processing...' : 'Process Payment'}
                      </button>
                    </div>
                  </div>
                )}
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

    </>
  );
}

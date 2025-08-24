import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type SalesInvoicePayload } from '../services/apiService';
import { notifications } from '@mantine/notifications';
import { Title, Paper, Text, Group, Button, SimpleGrid, Divider, Alert, SegmentedControl, LoadingOverlay } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';

export function CheckoutPage() {
  const { items, customer, grandTotal, clearCart } = useCartStore();
  const { currency, posProfile } = useSettingsStore();
  const navigate = useNavigate();

  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentModes = posProfile?.payments?.map((p: any) => p.mode_of_payment) || [];

  const handleCompletePayment = async () => {
    if (!customer || !selectedPaymentMode) {
      notifications.show({ color: 'red', title: 'Error', message: 'Please select a customer and payment method.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: SalesInvoicePayload = {
        customer: customer,
        items: items.map(item => ({
          item_code: item.name,
          qty: item.quantity,
          rate: item.standard_rate || 0,
        })),
        payments: [{
          mode_of_payment: selectedPaymentMode,
          amount: grandTotal(),
        }],
        update_stock: 1,
        docstatus: 1, // Submit the document
        // Add other required fields from POS Profile
        company: posProfile?.company,
        cost_center: posProfile?.cost_center,
        // ... and so on for other fields like warehouse, etc.
      };

      const result = await apiService.createSalesInvoice(payload);

      notifications.show({
        title: 'Success!',
        message: `Sales Invoice ${result.name} created successfully.`,
        color: 'teal',
        icon: <IconCircleCheck />,
      });

      clearCart();
      navigate('/');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      notifications.show({
        title: 'Submission Failed',
        message: `Could not create Sales Invoice. ${errorMessage}`,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) {
    return (
      <Alert variant="light" color="red" title="Customer Not Selected" icon={<IconAlertCircle />}>
        A customer must be selected before proceeding to checkout.
        <Button component={Link} to="/cart" mt="md">Back to Cart</Button>
      </Alert>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={isSubmitting} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Title order={1} mb="md">Checkout</Title>

      <Paper withBorder p="md" mb="xl">
        <Title order={3} mb="sm">Order Summary</Title>
        <Group justify="space-between"><Text>Customer:</Text><Text fw={500}>{customer}</Text></Group>
        <Divider my="sm" />
        <Group justify="space-between"><Text>Total:</Text><Text fw={700} size="xl">{currency} {grandTotal().toFixed(2)}</Text></Group>
      </Paper>

      <Paper withBorder p="md">
        <Title order={3} mb="sm">Select Payment Method</Title>
        {paymentModes.length > 0 ? (
          <SegmentedControl
            fullWidth
            size="md"
            value={selectedPaymentMode || ''}
            onChange={setSelectedPaymentMode}
            data={paymentModes}
          />
        ) : (
          <Text c="dimmed">No payment methods configured in POS Profile.</Text>
        )}
      </Paper>

      <Button fullWidth size="lg" mt="xl" onClick={handleCompletePayment} disabled={!selectedPaymentMode || isSubmitting}>
        Complete Payment
      </Button>
    </div>
  );
}

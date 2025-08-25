import { useState, useMemo } from 'react';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type SalesInvoicePayload } from '../services/apiService';
import { notifications } from '@mantine/notifications';
import { Title, Paper, Text, Group, Button, Divider, Alert, LoadingOverlay, Select, NumberInput, ActionIcon, Radio, Stack } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck, IconTrash, IconPlus } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';

interface PaymentEntry {
  mode: string;
  amount: number;
}

export function CheckoutPage() {
  const { items, customer, grandTotal, clearCart } = useCartStore();
  const { currency, posProfile } = useSettingsStore();
  const navigate = useNavigate();

  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(posProfile?.warehouse || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentPaymentMode, setCurrentPaymentMode] = useState<string | null>(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>(0);

  const paymentModes = posProfile?.payments?.map((p: any) => p.mode_of_payment) || [];
  const warehouses = posProfile?.warehouses?.map((w: any) => w.warehouse) || [];

  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const outstandingAmount = useMemo(() => grandTotal() - totalPaid, [grandTotal, totalPaid]);

  const handleAddPayment = () => {
    if (!currentPaymentMode || !currentPaymentAmount || +currentPaymentAmount <= 0) {
      notifications.show({ color: 'orange', title: 'Cannot Add Payment', message: 'Please select a payment mode and enter a valid amount.' });
      return;
    }
    setPayments([...payments, { mode: currentPaymentMode, amount: +currentPaymentAmount }]);
    setCurrentPaymentAmount(0);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleCompletePayment = async () => {
    if (!customer || !selectedWarehouse || payments.length === 0) {
      notifications.show({ color: 'red', title: 'Error', message: 'Please select a customer, warehouse, and add at least one payment.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const isPaidInFull = totalPaid >= grandTotal();
      const payload: SalesInvoicePayload = {
        customer: customer,
        set_warehouse: selectedWarehouse,
        items: items.map(item => ({ item_code: item.name, qty: item.quantity, rate: item.standard_rate || 0 })),
        payments: payments.map(p => ({ mode_of_payment: p.mode, amount: p.amount })),
        update_stock: 1,
        docstatus: isPaidInFull ? 1 : 0,
        company: posProfile?.company,
        cost_center: posProfile?.cost_center,
      };
      const result = await apiService.createSalesInvoice(payload);
      notifications.show({
        title: 'Success!',
        message: `Invoice ${result.name} created as ${isPaidInFull ? 'Submitted' : 'Draft'}.`,
        color: 'teal',
        icon: <IconCircleCheck />,
      });
      clearCart();
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      notifications.show({ title: 'Submission Failed', message: `Could not create invoice. ${errorMessage}`, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) {
    return <Alert variant="light" color="red" title="Customer Not Selected" icon={<IconAlertCircle />}><Button component={Link} to="/cart" mt="md">Back to Cart</Button></Alert>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={isSubmitting} />
      <Title order={1} mb="md">Checkout</Title>

      <Paper withBorder p="md" mb="xl">
        <Title order={3} mb="sm">Order Details</Title>
        <Group justify="space-between"><Text>Customer:</Text><Text fw={500}>{customer}</Text></Group>
        <Select label="Warehouse" placeholder="Select a warehouse" data={warehouses} value={selectedWarehouse} onChange={setSelectedWarehouse} mt="md" required />
        <Divider my="sm" />
        <Group justify="space-between"><Text>Grand Total:</Text><Text fw={700} size="xl" data-testid="grand-total">{currency} {grandTotal().toFixed(2)}</Text></Group>
        <Group justify="space-between"><Text c="blue">Total Paid:</Text><Text c="blue" fw={700} size="xl">{currency} {totalPaid.toFixed(2)}</Text></Group>
        <Group justify="space-between"><Text c="orange">Outstanding:</Text><Text c="orange" fw={700} size="xl">{currency} {outstandingAmount.toFixed(2)}</Text></Group>
      </Paper>

      <Paper withBorder p="md" mb="xl">
        <Title order={3} mb="sm">Add a Payment</Title>
        <Radio.Group label="Payment Mode" value={currentPaymentMode} onChange={setCurrentPaymentMode} withAsterisk>
          <Group mt="xs">
            {paymentModes.map((mode: string) => <Radio key={mode} value={mode} label={mode} />)}
          </Group>
        </Radio.Group>
        <NumberInput label="Amount" value={currentPaymentAmount} onChange={setCurrentPaymentAmount} min={0} placeholder="Enter amount" mt="md" />
        <Button onClick={handleAddPayment} leftSection={<IconPlus size={18} />} mt="md">Add Payment</Button>
      </Paper>

      {payments.length > 0 && (
        <Paper withBorder p="md">
          <Title order={4} mb="sm">Payments Added</Title>
          <Stack gap="xs">
            {payments.map((p, index) => (
              <Group justify="space-between" key={index}>
                <Text>{p.mode}</Text>
                <Group>
                  <Text fw={500}>{currency} {p.amount.toFixed(2)}</Text>
                  <ActionIcon color="red" size="sm" variant="light" onClick={() => handleRemovePayment(index)} aria-label={`Remove ${p.mode} payment`}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <Button fullWidth size="lg" mt="xl" onClick={handleCompletePayment} disabled={payments.length === 0 || !selectedWarehouse || isSubmitting}>
        Complete Order
      </Button>
    </div>
  );
}

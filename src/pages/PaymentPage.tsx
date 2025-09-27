import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type PaymentEntryPayload } from '../services/apiService';
import { authService } from '../services/authService';
import { notifications } from '@mantine/notifications';
import { Title, Paper, Text, Group, Button, LoadingOverlay, NumberInput, ActionIcon, Radio, Stack, Alert } from '@mantine/core';
import { IconCircleCheck, IconTrash, IconPlus } from '@tabler/icons-react';

interface PaymentEntry {
  mode: string;
  amount: number;
}

interface ModeOfPaymentAccount {
  company: string;
  default_account: string;
}

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currency, posProfile } = useSettingsStore();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentPaymentMode, setCurrentPaymentMode] = useState<string | null>(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | string>(0);

  const paymentModes = posProfile?.payments?.map((p: any) => p.mode_of_payment) || [];

  useEffect(() => {
    if (orderId) {
      apiService.getSalesOrder(orderId)
        .then(data => {
          setOrder(data);
          setIsLoading(false);
        })
        .catch(err => {
          notifications.show({ color: 'red', title: 'Failed to load order', message: err.message });
          setIsLoading(false);
        });
    }
  }, [orderId]);

  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const outstandingAmount = useMemo(() => (order?.outstanding_amount || 0) - totalPaid, [order, totalPaid]);

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
    const user = authService.getLoggedInUser();
    if (!order || !posProfile || payments.length === 0 || !user) {
      notifications.show({ color: 'red', title: 'Error', message: 'An order, POS profile, payment, and logged-in user are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      for (const p of payments) {
        // This logic is adapted from the old CheckoutPage
        const modeOfPaymentDetails = await apiService.getModeOfPaymentDetails(p.mode);
        const paymentAccountEntry = modeOfPaymentDetails?.accounts?.find((acc: ModeOfPaymentAccount) => acc.company === posProfile.company);
        const paymentAccount = paymentAccountEntry?.default_account;

        if (!paymentAccount) {
          throw new Error(`Could not find payment account for mode ${p.mode} and company ${posProfile.company} in Mode of Payment details.`);
        }

        const today = new Date().toISOString().split('T')[0];
        const peDraftPayload: PaymentEntryPayload = {
          dt: 'Sales Order',
          dn: order.name,
          party_type: 'Customer',
          party: order.customer,
          paid_amount: p.amount,
          paid_to: paymentAccount,
          mode_of_payment: p.mode,
          company: posProfile.company,
          posting_date: today,
          reference_no: order.name,
          reference_date: today,
        };
        const peDraft = await apiService.createPaymentEntry(peDraftPayload);
        peDraft.paid_amount = p.amount;
        peDraft.base_paid_amount = p.amount;
        if (peDraft.references && peDraft.references.length > 0) {
          peDraft.references[0].allocated_amount = p.amount;
        }
        const savedPaymentEntry = await apiService.saveDoc(peDraft);
        await apiService.submitDoc(savedPaymentEntry);

        notifications.show({
          title: 'Payment Submitted',
          message: `Payment of ${p.amount} via ${p.mode} has been successfully submitted.`,
          color: 'green',
          icon: <IconCircleCheck />,
        });
      }
      navigate('/orders');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      notifications.show({ title: 'Payment Failed', message: `Could not submit payment. ${errorMessage}`, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingOverlay visible={true} />;
  if (!order) return <Alert color="red" title="Order not found">The requested sales order could not be found.</Alert>;

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={isSubmitting} />
      <Title order={1} mb="md">Collect Payment for Order {orderId}</Title>

      <Paper withBorder p="md" mb="xl">
        <Title order={3} mb="sm">Order Details</Title>
        <Group justify="space-between"><Text>Customer:</Text><Text fw={500}>{order.customer_name}</Text></Group>
        <Group justify="space-between"><Text>Grand Total:</Text><Text fw={700} size="xl">{currency} {order.grand_total.toFixed(2)}</Text></Group>
        <Group justify="space-between"><Text c="orange">Outstanding:</Text><Text data-testid="outstanding-amount" c="orange" fw={700} size="xl">{currency} {outstandingAmount.toFixed(2)}</Text></Group>
      </Paper>

      <Paper withBorder p="md" mb="xl">
        <Title order={3} mb="sm">Add a Payment</Title>
        <Radio.Group label="Payment Mode" value={currentPaymentMode} onChange={setCurrentPaymentMode} withAsterisk>
          <Group mt="xs">{paymentModes.map((mode: string) => <Radio key={mode} value={mode} label={mode} />)}</Group>
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
                  <ActionIcon color="red" size="sm" variant="light" onClick={() => handleRemovePayment(index)} aria-label={`Remove ${p.mode} payment`}><IconTrash size={16} /></ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <Button fullWidth size="lg" mt="xl" onClick={handleCompletePayment} disabled={payments.length === 0 || isSubmitting}>
        Submit Payment
      </Button>
    </div>
  );
}

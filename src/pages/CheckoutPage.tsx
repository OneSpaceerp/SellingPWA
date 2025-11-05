import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type SalesOrderPayload } from '../services/apiService';
import { authService } from '../services/authService';
import { notifications } from '@mantine/notifications';
import { Title, Paper, Text, Group, Button, Divider, Alert, LoadingOverlay, Badge, NumberInput, SegmentedControl } from '@mantine/core';
import { IconAlertCircle, IconCircleCheck, IconBuildingWarehouse } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';

export function CheckoutPage() {
  const { items, customer, grandTotal, clearCart, subTotal, totalDiscountAmount, additionalDiscountType, additionalDiscountValue, setAdditionalDiscount } = useCartStore();
  const { currency, posProfile } = useSettingsStore();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const warehouse = posProfile?.warehouse || null;

  const handleCreateSalesOrderDraft = async () => {
    const user = authService.getLoggedInUser();
    if (!customer || !posProfile || !warehouse || !user) {
      notifications.show({ color: 'red', title: 'Error', message: 'A customer, POS profile, warehouse, and logged-in user are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const deliveryDate = futureDate.toISOString().split('T')[0];

      // The Sales Order should be saved as a draft.
      const soPayload: SalesOrderPayload = {
        customer: customer.name,
        set_warehouse: warehouse,
        items: items.map(item => {
          const baseRate = item.standard_rate || 0;
          let discountedRate = baseRate;
          
          // Calculate discounted rate based on item discount
          if (item.itemDiscountType && item.itemDiscountValue) {
            if (item.itemDiscountType === 'Percentage') {
              discountedRate = baseRate - (baseRate * item.itemDiscountValue / 100);
            } else {
              discountedRate = baseRate - item.itemDiscountValue;
            }
          }
          
          const itemData: any = {
            item_code: item.name,
            qty: item.quantity,
            rate: discountedRate,
            delivery_date: deliveryDate,
          };
          
          // Add discount_percentage for display in ERPNext
          if (item.itemDiscountType === 'Percentage' && item.itemDiscountValue) {
            itemData.discount_percentage = item.itemDiscountValue;
          }
          
          return itemData;
        }),
        additional_discount_percentage: additionalDiscountType === 'Percentage' ? additionalDiscountValue : 0,
        discount_amount: additionalDiscountType === 'Amount' ? additionalDiscountValue : 0,
        update_stock: 1,
        docstatus: 0, // Save as draft
        company: posProfile.company,
        cost_center: posProfile.cost_center,
        hub_manager: user,
      };
      const soResult = await apiService.createSalesOrder(soPayload);
      notifications.show({
        title: 'Sales Order Draft Created',
        message: `Order ${soResult.name} has been successfully saved as a draft.`,
        color: 'teal',
        icon: <IconCircleCheck />,
      });

      clearCart();
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      notifications.show({ title: 'Submission Failed', message: `Could not create Sales Order. ${errorMessage}`, color: 'red' });
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
        <Group justify="space-between"><Text>Customer:</Text><Text fw={500}>{typeof customer === 'object' && customer !== null ? (customer.customer_name || customer.name) : customer}</Text></Group>
        <Group justify="space-between" mt="sm"><Text>Warehouse:</Text><Badge leftSection={<IconBuildingWarehouse size={14}/>} variant="light">{warehouse || 'Not Set'}</Badge></Group>
        <Divider my="sm" />
        <Group justify="space-between"><Text>Sub-total:</Text><Text>{currency} {subTotal().toFixed(2)}</Text></Group>
        <Group justify="space-between"><Text c="red">Discount:</Text><Text c="red">{currency} -{totalDiscountAmount().toFixed(2)}</Text></Group>
        <Divider my="sm" />
        <Group justify="space-between"><Text>Grand Total:</Text><Text fw={700} size="xl" data-testid="grand-total">{currency} {grandTotal().toFixed(2)}</Text></Group>
      </Paper>

      <Paper withBorder p="md" mb="xl">
        <Title order={3} mb="sm">Additional Discount</Title>
        <SegmentedControl
          value={additionalDiscountType}
          onChange={(value) => setAdditionalDiscount(value as 'Percentage' | 'Amount', additionalDiscountValue)}
          data={['Percentage', 'Amount']}
          mb="sm"
        />
        <NumberInput
          label={`Discount ${additionalDiscountType === 'Percentage' ? '(%)' : `(${currency})`}`}
          value={additionalDiscountValue}
          onChange={(value) => setAdditionalDiscount(additionalDiscountType, +value)}
          min={0}
        />
      </Paper>

      <Button fullWidth size="lg" mt="xl" onClick={handleCreateSalesOrderDraft} disabled={!warehouse || isSubmitting}>
        Create Sales Order Draft
      </Button>
    </div>
  );
}

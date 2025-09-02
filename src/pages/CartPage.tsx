import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { Title, Button, Group, Text, Paper, SimpleGrid, NumberInput, ActionIcon, Center, Badge } from '@mantine/core';
import { IconTrash, IconUserPlus, IconUserEdit } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function CartPage() {
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);
  const customer = useCartStore((state) => state.customer);
  const grandTotal = useCartStore((state) => state.grandTotal);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateRate = useCartStore((state) => state.updateRate);
  const clearCart = useCartStore((state) => state.clearCart);

  const currency = useSettingsStore((state) => state.currency);

  console.log('Customer in CartPage:', customer);

  if (items.length === 0) {
    return (
      <Center style={{ height: '50vh' }}>
        <Text size="xl">Your cart is empty. Add items from the Catalog.</Text>
      </Center>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={1}>Shopping Cart</Title>
        <Button color="red" variant="outline" onClick={clearCart}>
          Clear Cart
        </Button>
      </Group>

      <Paper withBorder p="md" mb="md">
        <Group justify="space-between">
          <div>
            <Text fw={500}>Customer</Text>
            {customer ? (
              <Badge size="lg" variant="light">
                {typeof customer === 'object' && customer.customer_name ? customer.customer_name : customer}
              </Badge>
            ) : (
              <Text c="dimmed">No customer selected</Text>
            )}
          </div>
          <Button
            onClick={() => navigate('/select-customer')}
            variant="outline"
            leftSection={customer ? <IconUserEdit size={16} /> : <IconUserPlus size={16} />}
          >
            {customer ? 'Change Customer' : 'Select Customer'}
          </Button>
        </Group>
      </Paper>

      <SimpleGrid cols={1} spacing="md">
        {items.map(item => (
          <Paper shadow="xs" p="md" withBorder key={item.name}>
            <Group justify="space-between">
              <div>
                <Text fw={500}>{item.item_name}</Text>
                <Group gap="xs" align="center">
                  <NumberInput
                    label="Rate"
                    value={item.standard_rate}
                    onChange={(value) => updateRate(item.name, Number(value))}
                    prefix={`${currency} `}
                    min={0}
                    step={0.01}
                    style={{ width: '120px' }}
                    size="xs"
                  />
                  <Text size="sm" c="dimmed"> x </Text>
                  <NumberInput
                    label="Qty"
                    value={item.quantity}
                    onChange={(value) => updateQuantity(item.name, Number(value))}
                    min={0} step={1} style={{ width: '80px' }}
                    size="xs"
                  />
                </Group>
              </div>
              <Group>
                <Text fw={700} miw={80} ta="right">{currency} {((item.standard_rate || 0) * item.quantity).toFixed(2)}</Text>
                <ActionIcon color="red" variant="subtle" onClick={() => removeItem(item.name)} aria-label={`Remove ${item.item_name}`}><IconTrash size={20} /></ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="xl" radius="md" mt="xl" style={{ position: 'sticky', bottom: '20px' }}>
        <Group justify="space-between">
          <Title order={2}>Grand Total:</Title>
          <Title order={2}>{currency} {grandTotal().toFixed(2)}</Title>
        </Group>
        <Button
          fullWidth
          mt="md"
          size="lg"
          disabled={!customer}
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </Button>
      </Paper>
    </>
  );
}

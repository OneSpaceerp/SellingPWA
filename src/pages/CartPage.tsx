import { useCartStore } from '../store/cartStore';
import { Title, Button, Group, Text, Paper, SimpleGrid, NumberInput, ActionIcon, Center } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

export function CartPage() {
  const { items, removeItem, updateQuantity, grandTotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <Center style={{ height: '50vh' }}>
        <Text size="xl">Your cart is empty.</Text>
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

      <SimpleGrid cols={1} spacing="md">
        {items.map(item => (
          <Paper shadow="xs" p="md" withBorder key={item.name}>
            <Group justify="space-between">
              <div>
                <Text fw={500}>{item.item_name}</Text>
                <Text size="sm" c="dimmed">
                  ${item.standard_rate?.toFixed(2) || '0.00'} each
                </Text>
              </div>
              <Group>
                <NumberInput
                  value={item.quantity}
                  onChange={(value) => updateQuantity(item.name, Number(value))}
                  min={0}
                  step={1}
                  style={{ width: '80px' }}
                />
                <Text fw={700} miw={80} ta="right">
                  ${((item.standard_rate || 0) * item.quantity).toFixed(2)}
                </Text>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => removeItem(item.name)}
                  aria-label={`Remove ${item.item_name}`}
                >
                  <IconTrash size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="xl" radius="md" mt="xl" style={{ position: 'sticky', bottom: '20px' }}>
        <Group justify="space-between">
          <Title order={2}>Grand Total:</Title>
          <Title order={2}>${grandTotal().toFixed(2)}</Title>
        </Group>
        <Button fullWidth mt="md" size="lg">
          Proceed to Checkout
        </Button>
      </Paper>
    </>
  );
}

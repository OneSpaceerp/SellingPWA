import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDisclosure } from '@mantine/hooks';
import { Title, Button, Group, Text, Paper, SimpleGrid, NumberInput, ActionIcon, Center, Badge } from '@mantine/core';
import { IconTrash, IconUserPlus, IconUserEdit } from '@tabler/icons-react';
import { CustomerSearchModal } from '../components/CustomerSearchModal';
import { type Customer } from '../db/db';
import { useNavigate } from 'react-router-dom';

export function CartPage() {
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);
  const customer = useCartStore((state) => state.customer);
  const grandTotal = useCartStore((state) => state.grandTotal);
  const setCustomer = useCartStore((state) => state.setCustomer);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const currency = useSettingsStore((state) => state.currency);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const handleSelectCustomer = (selectedCustomer: Customer) => {
    setCustomer(selectedCustomer.name);
  };

  if (items.length === 0) {
    return (
      <Center style={{ height: '50vh' }}>
        <Text size="xl">Your cart is empty. Add items from the Catalog.</Text>
      </Center>
    );
  }

  return (
    <>
      <CustomerSearchModal
        opened={modalOpened}
        onClose={closeModal}
        onSelect={handleSelectCustomer}
      />

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
              <Badge size="lg" variant="light">{customer}</Badge>
            ) : (
              <Text c="dimmed">No customer selected</Text>
            )}
          </div>
          <Button
            onClick={openModal}
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
                <Text size="sm" c="dimmed">{currency} {item.standard_rate?.toFixed(2) || '0.00'} each</Text>
              </div>
              <Group>
                <NumberInput
                  value={item.quantity}
                  onChange={(value) => updateQuantity(item.name, Number(value))}
                  min={0} step={1} style={{ width: '80px' }}
                />
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

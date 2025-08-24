import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db/db';
import { useCartStore } from '../store/cartStore';
import { notifications } from '@mantine/notifications';
import {
  Title,
  TextInput,
  SimpleGrid,
  Card,
  Text,
  Button,
  Group,
  rem,
  Center,
  Loader,
  Badge,
} from '@mantine/core';
import { IconSearch, IconCircleCheck } from '@tabler/icons-react';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const addItemToCart = useCartStore((state) => state.addItem);

  const items = useLiveQuery(async () => {
    const allItems = await db.items.toArray();
    if (!search) return allItems;
    return allItems.filter(item =>
      item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleAddToCart = (item: Item) => {
    addItemToCart(item);
    notifications.show({
      title: 'Item Added',
      message: `${item.item_name} has been added to your cart.`,
      color: 'teal',
      icon: <IconCircleCheck />,
      autoClose: 2000,
    });
  };

  const renderContent = () => {
    if (items === undefined) {
      return (
        <Center style={{ height: '50vh' }}><Loader data-testid="catalog-loader" /></Center>
      );
    }
    if (items.length === 0) {
      return (
        <Center style={{ height: '50vh' }}><Text>No products found.</Text></Center>
      );
    }
    return (
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={{ base: 'md', sm: 'xl' }}>
        {items.map((item) => (
          <Card shadow="sm" padding="lg" radius="md" withBorder key={item.name}>
            <Text fw={500} size="lg" truncate="end">{item.item_name}</Text>
            <Text size="sm" c="dimmed">{item.name}</Text>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={700} fz="xl">${item.standard_rate || '0.00'}</Text>
              <Badge color="pink" variant="light">{item.item_group}</Badge>
            </Group>
            <Button
              variant="light" color="blue" fullWidth mt="md" radius="md"
              onClick={() => handleAddToCart(item)}
            >
              Add to Cart
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <>
      <Title order={1} mb="md">Product Catalog</Title>
      <TextInput
        placeholder="Search by name or code..."
        leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="xl"
      />
      {renderContent()}
    </>
  );
}

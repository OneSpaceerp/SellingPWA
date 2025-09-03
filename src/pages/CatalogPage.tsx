import { useState, useEffect } from 'react';
import { apiService, type Item } from '../services/apiService';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { notifications } from '@mantine/notifications';
import { Title, TextInput, SimpleGrid, Card, Text, Button, Group, rem, Center, Loader, Badge } from '@mantine/core';
import { IconSearch, IconCircleCheck } from '@tabler/icons-react';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItemToCart = useCartStore((state) => state.addItem);
  const { currency, posProfile } = useSettingsStore();

  useEffect(() => {
    if (posProfile) {
      setIsLoading(true);
      const itemGroups = posProfile.item_groups.map(g => g.item_group);
      apiService.getItems(itemGroups)
        .then(data => {
          setItems(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [posProfile]);

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

  const filteredItems = items.filter(item =>
    item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderContent = () => {
    if (isLoading) {
      return <Center style={{ height: '50vh' }}><Loader data-testid="catalog-loader" /></Center>;
    }
    if (filteredItems.length === 0) {
      return <Center style={{ height: '50vh' }}><Text>No products found.</Text></Center>;
    }
    return (
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={{ base: 'md', sm: 'xl' }}>
        {filteredItems.map((item) => (
          <Card shadow="sm" padding="lg" radius="md" withBorder key={item.name}>
            <Text fw={500} size="lg" truncate="end">{item.item_name}</Text>
            <Text size="sm" c="dimmed">{item.name}</Text>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={700} fz="xl">{currency} {item.standard_rate || '0.00'}</Text>
              <Badge color="pink" variant="light">{item.item_group}</Badge>
            </Group>
            <Button variant="light" color="blue" fullWidth mt="md" radius="md" onClick={() => handleAddToCart(item)}>
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Item } from '../services/apiService';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { notifications } from '@mantine/notifications';
import { Title, TextInput, SimpleGrid, Card, Text, Button, rem, Center, Loader, Badge } from '@mantine/core';
import { IconSearch, IconCircleCheck } from '@tabler/icons-react';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem: addItemToCart, customer } = useCartStore();
  const { currency, posProfile } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!customer) {
      navigate('/select-customer');
    }
  }, [customer, navigate]);

  useEffect(() => {
    if (posProfile) {
      setIsLoading(true);
      const itemGroups = posProfile.item_groups.map(g => g.item_group);
      // Get price list from POS Profile (could be selling_price_list or price_list)
      const priceList = posProfile.selling_price_list || posProfile.price_list;
      apiService.getItems(itemGroups, priceList)
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
      return (
        <Center style={{ height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md" c="dimmed">Loading products...</Text>
          </div>
        </Center>
      );
    }
    if (filteredItems.length === 0) {
      return (
        <Center style={{ height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" c="dimmed" mb="md">🔍</Text>
            <Text size="lg" fw={500} mb="xs">No products found</Text>
            <Text size="sm" c="dimmed">Try adjusting your search terms</Text>
          </div>
        </Center>
      );
    }
    return (
      <SimpleGrid cols={{ base: 1, sm: 1, md: 1, lg: 1 }} spacing={{ base: 'md', sm: 'lg' }} style={{ margin: '0.06rem', padding: '0.06rem' }}>
        {filteredItems.map((item) => (
          <Card 
            key={item.name}
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '16px',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            {/* Product Image Placeholder */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              height: '80px',
              width: '80px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              flexShrink: 0
            }}>
              📦
            </div>

            {/* Product Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} size="md" style={{ color: '#495057', marginBottom: '4px', wordWrap: 'break-word', lineHeight: '1.3' }}>
                {item.item_name}
              </Text>
              <Text size="sm" c="dimmed" mb="xs">
                {item.name}
              </Text>
              <Badge 
                color="blue" 
                variant="light"
                style={{
                  background: 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea',
                  fontWeight: '500',
                  fontSize: '11px'
                }}
              >
                {item.item_group}
              </Badge>
            </div>

            {/* Price and Stock Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <Text fw={700} size="lg" style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {currency} {item.standard_rate || '0.00'}
              </Text>
              
              {/* Stock Quantity Display */}
              {customer && (
                <Badge 
                  color={(item.actual_qty || 0) > 0 ? 'green' : 'red'}
                  variant="light"
                  style={{
                    background: (item.actual_qty || 0) > 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                    color: (item.actual_qty || 0) > 0 ? '#28a745' : '#dc3545',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  {(item.actual_qty || 0)} units
                </Badge>
              )}
              
              <Button 
                variant="filled" 
                size="sm"
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  minWidth: '100px'
                }}
                onClick={() => handleAddToCart(item)}
              >
                🛒 Add
              </Button>
            </div>
          </Card>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <div style={{
      background: '#f8f9fa',
      minHeight: '100vh',
      padding: '0',
      width: '100%',
      margin: 0
    }}>
      {/* Modern Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        width: '100%',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Title order={1} c="white" mb="xs" style={{ fontSize: '2rem', fontWeight: '700' }}>
              🛍️ Product Catalog
            </Title>
            <Text size="lg" c="rgba(255,255,255,0.8)" style={{ fontWeight: '400' }}>
              Browse and add products to your cart
            </Text>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <Text size="sm" c="white" fw={500}>Total Products</Text>
            <Text size="xl" c="white" fw={700}>{items.length}</Text>
          </div>
        </div>
        
        {/* Search Section */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <TextInput
            placeholder="🔍 Search by name or code..."
            leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            styles={{
              input: {
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                '&:focus': {
                  background: 'white',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.3)'
                }
              }
            }}
          />
        </div>
      </div>
      
      {/* Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        minHeight: '60vh'
      }}>
        {renderContent()}
      </div>
    </div>
  );
}

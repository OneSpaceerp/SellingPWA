import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { Title, Button, Group, Text, SimpleGrid, NumberInput, ActionIcon, Badge, Card } from '@mantine/core';
import { IconTrash, IconUserPlus, IconUserEdit, IconShoppingCart, IconCreditCard } from '@tabler/icons-react';
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
      <div style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        padding: '0'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          margin: '20px 16px'
        }}>
          <Text size="4xl" mb="md">🛒</Text>
          <Title order={1} mb="md" style={{ color: '#495057' }}>Your Cart is Empty</Title>
          <Text size="lg" c="dimmed" mb="xl">Add items from the catalog to get started</Text>
          <Button 
            size="lg"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
            onClick={() => navigate('/catalog')}
          >
            🛍️ Browse Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <Title order={1} c="white" mb="xs" style={{ fontSize: '2rem', fontWeight: '700' }}>
              🛒 Shopping Cart
            </Title>
            <Text size="lg" c="rgba(255,255,255,0.8)" style={{ fontWeight: '400' }}>
              Review your items and proceed to checkout
            </Text>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <Text size="sm" c="white" fw={500}>Items</Text>
            <Text size="xl" c="white" fw={700}>{items.length}</Text>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button 
            color="red" 
            variant="outline"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontWeight: '600'
            }}
            onClick={clearCart}
          >
            🗑️ Clear Cart
          </Button>
          <Button
            onClick={() => navigate('/catalog')}
            variant="outline"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontWeight: '600'
            }}
            leftSection={<IconShoppingCart size={16} />}
          >
            Continue Shopping
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <Group justify="space-between" align="center">
          <div>
            <Text fw={600} size="lg" mb="xs" style={{ color: '#495057' }}>Customer Information</Text>
            {customer ? (
              <Badge 
                size="lg" 
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '8px 16px'
                }}
              >
                {typeof customer === 'object' && customer !== null ? (customer.customer_name || customer.name) : customer}
              </Badge>
            ) : (
              <Text c="dimmed" size="md">No customer selected</Text>
            )}
          </div>
          <Button
            onClick={() => navigate('/select-customer')}
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #6f42c1 100%)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
            leftSection={customer ? <IconUserEdit size={16} /> : <IconUserPlus size={16} />}
          >
            {customer ? 'Change Customer' : 'Select Customer'}
          </Button>
        </Group>
      </Card>

      {/* Cart Items */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <Title order={2} style={{ color: '#495057', margin: 0 }}>📦 Cart Items</Title>
        </div>
        
        <SimpleGrid cols={1} spacing="md">
          {items.map(item => (
            <Card 
              key={item.name}
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Text fw={600} size="lg" mb="xs" style={{ color: '#495057' }}>
                    {item.item_name}
                  </Text>
                  <Text size="sm" c="dimmed" mb="md">
                    {item.name}
                  </Text>
                  
                  <Group gap="md" align="center">
                    <div>
                      <Text size="sm" fw={500} mb="xs" c="dimmed">Rate</Text>
                      <NumberInput
                        value={item.standard_rate}
                        onChange={(value) => updateRate(item.name, Number(value))}
                        prefix={`${currency} `}
                        min={0}
                        step={0.01}
                        style={{ width: '140px' }}
                        size="sm"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '2px solid #e9ecef',
                            fontWeight: '500'
                          }
                        }}
                      />
                    </div>
                    <Text size="lg" c="dimmed" mt="xl">×</Text>
                    <div>
                      <Text size="sm" fw={500} mb="xs" c="dimmed">Quantity</Text>
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => updateQuantity(item.name, Number(value))}
                        min={0} 
                        step={1} 
                        style={{ width: '100px' }}
                        size="sm"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '2px solid #e9ecef',
                            fontWeight: '500'
                          }
                        }}
                      />
                    </div>
                  </Group>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <Text fw={700} size="xl" style={{ 
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {currency} {((item.standard_rate || 0) * item.quantity).toFixed(2)}
                  </Text>
                  <ActionIcon 
                    color="red" 
                    variant="subtle" 
                    onClick={() => removeItem(item.name)} 
                    aria-label={`Remove ${item.item_name}`}
                    style={{
                      marginTop: '8px',
                      borderRadius: '8px'
                    }}
                  >
                    <IconTrash size={20} />
                  </ActionIcon>
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </div>

      {/* Grand Total and Checkout */}
      <Card style={{
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)',
        position: 'sticky',
        bottom: '20px'
      }}>
        <Group justify="space-between" align="center">
          <div>
            <Text size="lg" fw={500} c="rgba(255,255,255,0.8)">Grand Total</Text>
            <Title order={1} c="white" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
              {currency} {grandTotal().toFixed(2)}
            </Title>
          </div>
          <Button
            size="xl"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontWeight: '700',
              borderRadius: '12px',
              padding: '16px 32px'
            }}
            leftSection={<IconCreditCard size={24} />}
            disabled={!customer}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </Button>
        </Group>
      </Card>
    </div>
  );
}

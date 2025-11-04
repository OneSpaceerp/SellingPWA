import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type Visit, type VisitSample, type Customer, type Item } from '../services/apiService';
import { authService } from '../services/authService';
import { notifications } from '@mantine/notifications';
import {
  Title,
  TextInput,
  Textarea,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Select,
  Grid,
  Badge,
  Alert,
  Loader,
  ActionIcon,
  NumberInput,
} from '@mantine/core';
import { IconCheck, IconAlertCircle, IconTrash, IconPlus, IconCalendar, IconUser, IconMessage, IconPackage } from '@tabler/icons-react';

export function NewVisitPage() {
  const navigate = useNavigate();
  const { posProfile } = useSettingsStore();
  const seller = authService.getLoggedInUser();

  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const [formData, setFormData] = useState({
    customer: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_comments: '',
    customer_feedback: '',
    samples: [] as (VisitSample & { tempId: string })[],
  });

  useEffect(() => {
    // Load customers
    if (posProfile) {
      setLoadingCustomers(true);
      const customerGroups = posProfile.customer_groups.map((g: { customer_group: string }) => g.customer_group);
      apiService.getCustomers(customerGroups)
        .then(data => {
          setCustomers(data);
          setLoadingCustomers(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingCustomers(false);
        });
    }

    // Load items
    if (posProfile) {
      setLoadingItems(true);
      const itemGroups = posProfile.item_groups.map((g: { item_group: string }) => g.item_group);
      const priceList = posProfile.selling_price_list || posProfile.price_list;
      apiService.getItems(itemGroups, priceList)
        .then(data => {
          setItems(data);
          setLoadingItems(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingItems(false);
        });
    }
  }, [posProfile]);

  const handleSampleChange = (tempId: string, field: string, value: any) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      samples: prev.samples.map((sample: typeof formData.samples[0]) =>
        sample.tempId === tempId ? { ...sample, [field]: value } : sample
      )
    }));
  };

  const addSample = () => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      samples: [
        ...prev.samples,
        {
          tempId: `temp-${Date.now()}-${Math.random()}`,
          item_code: '',
          qty: 1,
        }
      ]
    }));
  };

  const removeSample = (tempId: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      samples: prev.samples.filter((s: typeof formData.samples[0]) => s.tempId !== tempId)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.customer) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select a customer',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    if (!seller) {
      notifications.show({
        title: 'Error',
        message: 'Seller information not available',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedCustomer = customers.find((c: Customer) => c.name === formData.customer);
      
      // Create visit
      const visitData: Visit = {
        customer: formData.customer,
        customer_name: selectedCustomer?.customer_name || '',
        visit_date: formData.visit_date,
        visit_comments: formData.visit_comments || '',
        customer_feedback: formData.customer_feedback || '',
        seller: seller,
        status: 'Completed',
        samples: formData.samples.filter((s: typeof formData.samples[0]) => s.item_code && s.qty > 0).map((s: typeof formData.samples[0]) => ({
          item_code: s.item_code,
          qty: s.qty,
          uom: items.find((i: Item) => i.name === s.item_code)?.stock_uom || 'Nos',
        })),
      };

      const visit = await apiService.createVisit(visitData);
      console.log('Visit created:', visit);

      // If samples were provided, create stock entry
      if (formData.samples.filter((s: typeof formData.samples[0]) => s.item_code && s.qty > 0).length > 0 && posProfile?.company) {
        try {
          // Get or create warehouse with seller name
          const warehouseName = seller; // Warehouse name is the seller name
          const warehouse = await apiService.getOrCreateWarehouse(warehouseName, posProfile.company);

          // Create stock entry for samples (Material Transfer from main warehouse to seller warehouse)
          const stockEntryData = {
            doctype: 'Stock Entry',
            stock_entry_type: 'Material Transfer',
            from_warehouse: posProfile.warehouse || warehouse,
            to_warehouse: warehouse,
                          items: formData.samples
                .filter((s: typeof formData.samples[0]) => s.item_code && s.qty > 0)
              .map((s: typeof formData.samples[0]) => {
                const item = items.find((i: Item) => i.name === s.item_code);
                return {
                  item_code: s.item_code,
                  qty: s.qty,
                  uom: item?.stock_uom || 'Nos',
                  transfer_qty: s.qty,
                  stock_uom: item?.stock_uom || 'Nos',
                  s_warehouse: posProfile.warehouse || warehouse,
                  t_warehouse: warehouse,
                };
              }),
          };

          await apiService.createStockEntry(stockEntryData);
          console.log('Stock entry created for samples');
        } catch (stockError) {
          console.error('Error creating stock entry:', stockError);
          // Don't fail the visit creation if stock entry fails
          notifications.show({
            title: 'Warning',
            message: 'Visit created but sample stock entry failed. Please create it manually.',
            color: 'yellow',
            icon: <IconAlertCircle size={16} />,
          });
        }
      }

      notifications.show({
        title: 'Visit Created',
        message: `Visit to ${selectedCustomer?.customer_name || formData.customer} has been recorded successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Navigate back
      navigate('/service-plan');
    } catch (error) {
      console.error('Error creating visit:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create visit. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCustomer = customers.find((c: Customer) => c.name === formData.customer);

  return (
    <div style={{
      padding: '0',
      width: '100%',
      margin: 0,
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '16px',
        margin: '0.06rem',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <Group align="center" gap="md">
          <IconCalendar size={32} />
          <div>
            <Title order={1} c="white" mb="xs">New Visit</Title>
            <Text c="white" size="sm" opacity={0.9}>
              Record a customer visit with comments, feedback, and samples
            </Text>
          </div>
        </Group>
      </div>

      <div style={{ margin: '0.06rem', padding: '0.06rem' }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Customer and Date */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconUser size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Visit Information</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Customer"
                      placeholder="Select customer"
                      value={formData.customer}
                      onChange={(value) => setFormData((prev: typeof formData) => ({ ...prev, customer: value || '' }))}
                      data={customers.map((c: Customer) => ({ value: c.name, label: c.customer_name }))}
                      searchable
                      required
                      size="md"
                      leftSection={<IconUser size={16} />}
                      disabled={loadingCustomers}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      type="date"
                      label="Visit Date"
                      value={formData.visit_date}
                      onChange={(e) => setFormData((prev: typeof formData) => ({ 
                        ...prev, 
                        visit_date: e.target.value || new Date().toISOString().split('T')[0] 
                      }))}
                      required
                      size="md"
                      leftSection={<IconCalendar size={16} />}
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Visit Comments */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconMessage size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Visit Comments</Text>
                </Group>
                
                <Textarea
                  label="Salesman Comments"
                  placeholder="Enter your comments about this visit..."
                  value={formData.visit_comments}
                  onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, visit_comments: e.target.value }))}
                  minRows={4}
                  size="md"
                />
              </Card>

              {/* Customer Feedback */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconMessage size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Customer Feedback</Text>
                </Group>
                
                <Textarea
                  label="Customer Feedback"
                  placeholder="Enter customer feedback..."
                  value={formData.customer_feedback}
                  onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, customer_feedback: e.target.value }))}
                  minRows={4}
                  size="md"
                />
              </Card>

              {/* Samples */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md" justify="space-between">
                  <Group>
                    <IconPackage size={20} color="#667eea" />
                    <Text fw={600} size="lg" c="#495057">Samples Provided</Text>
                  </Group>
                  <Button
                    onClick={addSample}
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    size="sm"
                    style={{
                      borderColor: '#667eea',
                      color: '#667eea',
                    }}
                  >
                    Add Sample
                  </Button>
                </Group>

                {formData.samples.length === 0 ? (
                  <Alert color="blue" title="No Samples">
                    Click "Add Sample" to record samples provided to the customer.
                  </Alert>
                ) : (
                  <Stack gap="md">
                    {formData.samples.map((sample) => (
                      <Card key={sample.tempId} withBorder p="md">
                        <Group justify="space-between" align="flex-end">
                          <Grid style={{ flex: 1 }}>
                            <Grid.Col span={{ base: 12, md: 8 }}>
                              <Select
                                label="Item"
                                placeholder="Select item"
                                value={sample.item_code}
                                                                 onChange={(value: string | null) => handleSampleChange(sample.tempId, 'item_code', value || '')}
                                data={items.map((item: Item) => ({ 
                                  value: item.name, 
                                  label: `${item.item_name} (${item.name})` 
                                }))}
                                searchable
                                size="md"
                                disabled={loadingItems}
                              />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                              <NumberInput
                                label="Quantity"
                                value={sample.qty}
                                onChange={(value) => handleSampleChange(sample.tempId, 'qty', Number(value) || 0)}
                                min={0}
                                size="md"
                              />
                            </Grid.Col>
                          </Grid>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => removeSample(sample.tempId)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}

                <Alert color="blue" mt="md" title="Note">
                  Samples will be stored in a warehouse named after the seller ({seller}).
                </Alert>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              {/* Summary Card */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Text fw={600} size="lg" mb="md" c="#495057">Visit Summary</Text>
                
                <Stack gap="sm">
                  <div>
                    <Text size="sm" c="dimmed">Customer</Text>
                    <Text fw={500}>{selectedCustomer?.customer_name || 'Not selected'}</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" c="dimmed">Visit Date</Text>
                    <Text fw={500}>{new Date(formData.visit_date).toLocaleDateString()}</Text>
                  </div>

                  <div>
                    <Text size="sm" c="dimmed">Seller</Text>
                    <Badge color="blue" variant="light">
                      {seller || 'Not available'}
                    </Badge>
                  </div>

                  <div>
                    <Text size="sm" c="dimmed">Samples</Text>
                    <Text size="sm">{formData.samples.filter((s: typeof formData.samples[0]) => s.item_code && s.qty > 0).length} item(s)</Text>
                  </div>
                </Stack>
              </Card>

              {/* Action Buttons */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Stack gap="md">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.customer}
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                    leftSection={isLoading ? <Loader size="sm" color="white" /> : <IconCheck size={16} />}
                    fullWidth
                  >
                    {isLoading ? 'Creating Visit...' : 'Create Visit'}
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/service-plan')}
                    variant="outline"
                    size="md"
                    fullWidth
                    style={{
                      borderColor: '#dee2e6',
                      color: '#6c757d'
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}

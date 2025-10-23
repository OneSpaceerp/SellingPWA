import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService } from '../services/apiService';
import { notifications } from '@mantine/notifications';
import {
  Title,
  TextInput,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Divider,
  NumberInput,
  Select,
  Textarea,
  Grid,
  Badge,
  Alert,
  Loader,
  Center
} from '@mantine/core';
import { IconUserPlus, IconMail, IconPhone, IconMapPin, IconCheck, IconAlertCircle } from '@tabler/icons-react';

export function NewCustomerPage() {
  const navigate = useNavigate();
  const setCustomer = useCartStore((state) => state.setCustomer);
  const { posProfile } = useSettingsStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Customer basic info
    customer_name: '',
    customer_group: '',
    
    // Contact info
    email_id: '',
    mobile_no: '',
    phone: '',
    
    // Address info
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'Egypt', // Default country
    
    // Additional contact
    additional_email: '',
    additional_mobile: '',
    additional_phone: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_group) {
      notifications.show({
        title: 'Validation Error',
        message: 'Customer name and group are required',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create customer
      const customerData = {
        doctype: 'Customer',
        customer_name: formData.customer_name,
        customer_group: formData.customer_group,
        customer_type: 'Individual',
        territory: 'All Territories',
        disabled: 0,
      };

      const customer = await apiService.createCustomer(customerData);
      console.log('Customer created:', customer);

      // Create primary contact if email or mobile provided
      if (formData.email_id || formData.mobile_no || formData.phone) {
        const contactData = {
          doctype: 'Contact',
          first_name: formData.customer_name,
          email_id: formData.email_id || '',
          mobile_no: formData.mobile_no || '',
          phone: formData.phone || '',
          is_primary_contact: 1,
          links: [{
            link_doctype: 'Customer',
            link_name: customer.name
          }]
        };

        await apiService.createContact(contactData);
        console.log('Contact created');
      }

      // Create primary address if address provided
      if (formData.address_line1 || formData.city) {
        const addressData = {
          doctype: 'Address',
          address_title: `${formData.customer_name} - Primary Address`,
          address_line1: formData.address_line1 || '',
          address_line2: formData.address_line2 || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || '',
          country: formData.country || 'Egypt',
          is_primary_address: 1,
          is_shipping_address: 1,
          links: [{
            link_doctype: 'Customer',
            link_name: customer.name
          }]
        };

        await apiService.createAddress(addressData);
        console.log('Address created');
      }

      // Create additional contact if provided
      if (formData.additional_email || formData.additional_mobile || formData.additional_phone) {
        const additionalContactData = {
          doctype: 'Contact',
          first_name: `${formData.customer_name} - Additional Contact`,
          email_id: formData.additional_email || '',
          mobile_no: formData.additional_mobile || '',
          phone: formData.additional_phone || '',
          is_primary_contact: 0,
          links: [{
            link_doctype: 'Customer',
            link_name: customer.name
          }]
        };

        await apiService.createContact(additionalContactData);
        console.log('Additional contact created');
      }

      // Set the created customer in the cart store
      setCustomer({
        name: customer.name,
        customer_name: customer.customer_name,
        customer_group: customer.customer_group,
        email_id: formData.email_id,
        mobile_no: formData.mobile_no,
        phone: formData.phone,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
      });

      notifications.show({
        title: 'Customer Created',
        message: `${formData.customer_name} has been created successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Navigate back to the previous page
      navigate(-1);
    } catch (error) {
      console.error('Error creating customer:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create customer. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const customerGroups = posProfile?.customer_groups?.map(g => g.customer_group) || [];

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
          <IconUserPlus size={32} />
          <div>
            <Title order={1} c="white" mb="xs">Create New Customer</Title>
            <Text c="white" size="sm" opacity={0.9}>
              Add a new customer with contact and address information
            </Text>
          </div>
        </Group>
      </div>

      <div style={{ margin: '0.06rem', padding: '0.06rem' }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Basic Information */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconUserPlus size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Basic Information</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Customer Name"
                      placeholder="Enter customer name"
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      required
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Customer Group"
                      placeholder="Select customer group"
                      value={formData.customer_group}
                      onChange={(value) => handleInputChange('customer_group', value || '')}
                      data={customerGroups}
                      required
                      size="md"
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Contact Information */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconMail size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Contact Information</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Email"
                      placeholder="customer@example.com"
                      value={formData.email_id}
                      onChange={(e) => handleInputChange('email_id', e.target.value)}
                      leftSection={<IconMail size={16} />}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Mobile Number"
                      placeholder="+20 123 456 7890"
                      value={formData.mobile_no}
                      onChange={(e) => handleInputChange('mobile_no', e.target.value)}
                      leftSection={<IconPhone size={16} />}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Phone Number"
                      placeholder="+20 2 1234 5678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      leftSection={<IconPhone size={16} />}
                      size="md"
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Address Information */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconMapPin size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Address Information</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Address Line 1"
                      placeholder="Street address, building number"
                      value={formData.address_line1}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Address Line 2"
                      placeholder="Apartment, suite, unit, etc."
                      value={formData.address_line2}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="City"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="State/Province"
                      placeholder="State or Province"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Postal Code"
                      placeholder="12345"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Country"
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      size="md"
                    />
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Additional Contact */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconMail size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Additional Contact (Optional)</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Additional Email"
                      placeholder="additional@example.com"
                      value={formData.additional_email}
                      onChange={(e) => handleInputChange('additional_email', e.target.value)}
                      leftSection={<IconMail size={16} />}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Additional Mobile"
                      placeholder="+20 987 654 3210"
                      value={formData.additional_mobile}
                      onChange={(e) => handleInputChange('additional_mobile', e.target.value)}
                      leftSection={<IconPhone size={16} />}
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Additional Phone"
                      placeholder="+20 2 9876 5432"
                      value={formData.additional_phone}
                      onChange={(e) => handleInputChange('additional_phone', e.target.value)}
                      leftSection={<IconPhone size={16} />}
                      size="md"
                    />
                  </Grid.Col>
                </Grid>
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
                <Text fw={600} size="lg" mb="md" c="#495057">Customer Summary</Text>
                
                <Stack gap="sm">
                  <div>
                    <Text size="sm" c="dimmed">Name</Text>
                    <Text fw={500}>{formData.customer_name || 'Not specified'}</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" c="dimmed">Group</Text>
                    <Badge color="blue" variant="light">
                      {formData.customer_group || 'Not selected'}
                    </Badge>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text size="sm" c="dimmed">Primary Contact</Text>
                    <Text size="sm">{formData.email_id || 'No email'}</Text>
                    <Text size="sm">{formData.mobile_no || 'No mobile'}</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" c="dimmed">Address</Text>
                    <Text size="sm">
                      {formData.address_line1 ? `${formData.address_line1}, ${formData.city || ''}` : 'No address'}
                    </Text>
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
                    disabled={isLoading || !formData.customer_name || !formData.customer_group}
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                    leftSection={isLoading ? <Loader size="sm" color="white" /> : <IconCheck size={16} />}
                    fullWidth
                  >
                    {isLoading ? 'Creating Customer...' : 'Create Customer'}
                  </Button>
                  
                  <Button
                    onClick={() => navigate(-1)}
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

              {/* Help Text */}
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Information"
                color="blue"
                variant="light"
                style={{
                  borderRadius: '8px'
                }}
              >
                <Text size="sm">
                  Customer name and group are required. Contact and address information are optional but recommended for better customer management.
                </Text>
              </Alert>
            </Stack>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}

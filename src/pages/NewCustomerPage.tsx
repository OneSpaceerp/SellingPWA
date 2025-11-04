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
  Select,
  Grid,
  Badge,
  Alert,
  Loader,
  ActionIcon
} from '@mantine/core';
import { IconUserPlus, IconMail, IconPhone, IconMapPin, IconCheck, IconAlertCircle, IconTrash, IconPlus, IconLocation } from '@tabler/icons-react';

interface AddressFormData {
  address_title: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: string;
  longitude?: string;
}

export function NewCustomerPage() {
  const navigate = useNavigate();
  const setCustomer = useCartStore((state) => state.setCustomer);
  const { posProfile } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    // Customer basic info
    customer_name: '',
    customer_group: '',

    // Contact info (dynamic array)
    contacts: [
      {
        first_name: '',
        email_id: '',
        mobile_no: '',
        phone: '',
      }
    ],

    // Address info (dynamic array) - start with one empty address
    addresses: [
      {
        address_title: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'Egypt',
        latitude: '',
        longitude: '',
      }
    ] as AddressFormData[],
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          first_name: '',
          email_id: '',
          mobile_no: '',
          phone: '',
        }
      ]
    }));
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length > 1) {
      setFormData(prev => ({
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((address, i) =>
        i === index ? { ...address, [field]: value } : address
      )
    }));
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          address_title: `${formData.customer_name || 'Customer'} - Address ${prev.addresses.length + 1}`,
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'Egypt',
          latitude: '',
          longitude: '',
        }
      ]
    }));
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const getCurrentLocation = (index: number) => {
    // Prevent multiple simultaneous requests
    if (gettingLocation !== null) {
      return;
    }

    if (!navigator.geolocation) {
      notifications.show({
        title: 'Error',
        message: 'Geolocation is not supported by your browser',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setGettingLocation(index);
    notifications.show({
      id: `location-${index}`,
      title: 'Requesting Location Access',
      message: 'Please allow location access in your browser',
      color: 'blue',
      icon: <IconLocation size={16} />,
      autoClose: 5000,
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleAddressChange(index, 'latitude', latitude.toString());
        handleAddressChange(index, 'longitude', longitude.toString());
        notifications.show({
          title: 'Location Retrieved',
          message: `Location set: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        setGettingLocation(null);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable location permissions in your browser settings and try again.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable. Please check your device settings.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        notifications.show({
          title: 'Location Error',
          message: errorMessage,
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
        setGettingLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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

      // Create all contacts from the contacts array
      for (let i = 0; i < formData.contacts.length; i++) {
        const contact = formData.contacts[i];
        if (contact.email_id || contact.mobile_no || contact.phone) {
          const contactData = {
            doctype: 'Contact',
            first_name: contact.first_name || (i === 0 ? formData.customer_name : `${formData.customer_name} - Contact ${i + 1}`),
            email_id: contact.email_id || '',
            mobile_no: contact.mobile_no || '',
            phone: contact.phone || '',
            is_primary_contact: i === 0 ? 1 : 0,
            links: [{
              link_doctype: 'Customer',
              link_name: customer.name
            }]
          };

          await apiService.createContact(contactData);
          console.log(`Contact ${i + 1} created`);
        }
      }

      // Create addresses if provided
      for (let i = 0; i < formData.addresses.length; i++) {
        const address = formData.addresses[i];
        if (address.address_line1 || address.city) {
          const addressData = {
            doctype: 'Address',
            address_title: address.address_title || `${formData.customer_name} - Address ${i + 1}`,
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'Egypt',
            latitude: address.latitude || '',
            longitude: address.longitude || '',
            is_primary_address: i === 0 ? 1 : 0,
            is_shipping_address: 1,
            links: [{
              link_doctype: 'Customer',
              link_name: customer.name
            }]
          };

          await apiService.createAddress(addressData);
          console.log(`Address ${i + 1} created`);
        }
      }

      // Set the created customer in the cart store (use first contact and address as primary)
      const primaryContact = formData.contacts[0] || {};
      const primaryAddress = formData.addresses[0] || {};
      setCustomer({
        name: customer.name,
        customer_name: customer.customer_name,
        customer_group: customer.customer_group,
        email_id: primaryContact.email_id,
        mobile_no: primaryContact.mobile_no,
        phone: primaryContact.phone,
        address_line1: primaryAddress.address_line1,
        address_line2: primaryAddress.address_line2,
        city: primaryAddress.city,
        state: primaryAddress.state,
        pincode: primaryAddress.pincode,
        country: primaryAddress.country,
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
              {formData.contacts.map((contact, index) => (
                <Card
                  key={index}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <Group mb="md" justify="space-between">
                    <Group>
                      <IconMail size={20} color="#667eea" />
                      <Text fw={600} size="lg" c="#495057">
                        {index === 0 ? 'Primary Contact' : `Contact ${index + 1}`}
                      </Text>
                      {index === 0 && (
                        <Badge color="blue" size="sm">Primary</Badge>
                      )}
                    </Group>
                    {index > 0 && (
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => removeContact(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                  
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Contact Name"
                        placeholder={index === 0 ? formData.customer_name : "Enter contact name"}
                        value={contact.first_name}
                        onChange={(e) => handleContactChange(index, 'first_name', e.target.value)}
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Email"
                        placeholder="email@example.com"
                        value={contact.email_id}
                        onChange={(e) => handleContactChange(index, 'email_id', e.target.value)}
                        leftSection={<IconMail size={16} />}
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Mobile Number"
                        placeholder="+20 123 456 7890"
                        value={contact.mobile_no}
                        onChange={(e) => handleContactChange(index, 'mobile_no', e.target.value)}
                        leftSection={<IconPhone size={16} />}
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Phone Number"
                        placeholder="+20 2 1234 5678"
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        leftSection={<IconPhone size={16} />}
                        size="md"
                      />
                    </Grid.Col>
                  </Grid>
                </Card>
              ))}
              
              {/* Add Contact Button */}
              <Button
                onClick={addContact}
                variant="light"
                leftSection={<IconPlus size={16} />}
                style={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  borderRadius: '8px'
                }}
              >
                Add Another Contact
              </Button>

                            {/* Address Information */}
              {formData.addresses.map((address, index) => (
                <Card
                  key={index}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <Group mb="md" justify="space-between">
                    <Group>
                      <IconMapPin size={20} color="#667eea" />
                      <Text fw={600} size="lg" c="#495057">
                        {index === 0 ? 'Primary Address' : `Address ${index + 1}`}                                                                              
                      </Text>
                      {index === 0 && (
                        <Badge color="blue" size="sm">Primary</Badge>
                      )}
                    </Group>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => removeAddress(index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>

                  <Grid>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Address Title"
                        placeholder="Address title"
                        value={address.address_title}
                        onChange={(e) => handleAddressChange(index, 'address_title', e.target.value)}                                                           
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Address Line 1"
                        placeholder="Street address, building number"
                        value={address.address_line1}
                        onChange={(e) => handleAddressChange(index, 'address_line1', e.target.value)}                                                           
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Address Line 2"
                        placeholder="Apartment, suite, unit, etc."
                        value={address.address_line2}
                        onChange={(e) => handleAddressChange(index, 'address_line2', e.target.value)}                                                           
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        label="City"
                        placeholder="City"
                        value={address.city}
                        onChange={(e) => handleAddressChange(index, 'city', e.target.value)}                                                                    
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        label="State/Province"
                        placeholder="State or Province"
                        value={address.state}
                        onChange={(e) => handleAddressChange(index, 'state', e.target.value)}                                                                   
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        label="Postal Code"
                        placeholder="12345"
                        value={address.pincode}
                        onChange={(e) => handleAddressChange(index, 'pincode', e.target.value)}                                                                 
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Country"
                        placeholder="Country"
                        value={address.country}
                        onChange={(e) => handleAddressChange(index, 'country', e.target.value)}                                                                 
                        size="md"
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Divider my="md" label="Location Coordinates" labelPosition="center" />
                    </Grid.Col>
                                         <Grid.Col span={12}>
                       <Group gap="sm" align="flex-end">
                         <TextInput
                           label="Latitude"
                           placeholder="e.g., 30.0444"
                           value={address.latitude || ''}
                           onChange={(e) => handleAddressChange(index, 'latitude', e.target.value)}
                           size="md"
                           style={{ flex: 1 }}
                         />
                         <TextInput
                           label="Longitude"
                           placeholder="e.g., 31.2357"
                           value={address.longitude || ''}
                           onChange={(e) => handleAddressChange(index, 'longitude', e.target.value)}
                           size="md"
                           style={{ flex: 1 }}
                         />
                                                   <Button
                            onClick={() => getCurrentLocation(index)}
                            variant="light"
                            leftSection={gettingLocation === index ? <Loader size={16} /> : <IconLocation size={16} />}
                            disabled={gettingLocation !== null}
                            loading={gettingLocation === index}
                            style={{
                              borderColor: '#667eea',
                              color: '#667eea',
                            }}
                          >
                            {gettingLocation === index ? 'Getting Location...' : 'Get Location'}
                          </Button>
                       </Group>
                     </Grid.Col>
                  </Grid>
                </Card>
              ))}

              {/* Add Address Button */}
              <Button
                onClick={addAddress}
                variant="light"
                leftSection={<IconPlus size={16} />}
                style={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  borderRadius: '8px'
                }}
              >
                Add Address
              </Button>

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
                    <Text size="sm" c="dimmed">Contacts</Text>
                    <Text size="sm">{formData.contacts.length} contact(s) added</Text>
                  </div>
                  
                                    <div>
                    <Text size="sm" c="dimmed">Addresses</Text>
                    <Text size="sm">{formData.addresses.length} address(es) added</Text>                                                                          
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

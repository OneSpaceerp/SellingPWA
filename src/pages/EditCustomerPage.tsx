import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { apiService, type Contact, type Address } from '../services/apiService';
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
  ActionIcon,
  Center
} from '@mantine/core';
import { IconUserEdit, IconMail, IconPhone, IconMapPin, IconCheck, IconAlertCircle, IconTrash, IconPlus, IconLocation } from '@tabler/icons-react';

interface ContactFormData {
  id?: string;
  first_name: string;
  email_id: string;
  mobile_no: string;
  phone: string;
  isNew?: boolean;
}

interface AddressFormData {
  id?: string;
  address_title: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: string;
  longitude?: string;
  isNew?: boolean;
}

export function EditCustomerPage() {
  console.log('EditCustomerPage component rendered');
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  console.log('customerId from useParams:', customerId);
  const { posProfile } = useSettingsStore();
  
    const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [gettingLocation, setGettingLocation] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    // Customer basic info (read-only)
    customer_name: '',
    customer_group: '',
    customer_id: '',
    
    // Contact info (dynamic array)
    contacts: [] as ContactFormData[],

    // Address info (dynamic array)
    addresses: [] as AddressFormData[],
  });

  useEffect(() => {
    // Decode the customerId to handle special characters like #
    const decodedCustomerId = customerId ? decodeURIComponent(customerId) : null;
    console.log('EditCustomerPage useEffect triggered with customerId:', customerId);
    console.log('Decoded customerId:', decodedCustomerId);
    
    if (!decodedCustomerId) {
      console.log('No customerId, navigating back');
      navigate(-1);
      return;
    }

    const loadCustomerData = async () => {
      console.log('Starting to load customer data for:', decodedCustomerId);
      setIsLoadingData(true);
      try {
        // Fetch customer details first
        console.log('Fetching customer details...');
        const customer = await apiService.getCustomerDetails(decodedCustomerId);
        console.log('Customer loaded:', customer);
        
        if (!customer) {
          throw new Error('Customer data is empty');
        }
        
        // Try to fetch contacts and addresses separately
        let contacts: Contact[] = [];
        let addresses: Address[] = [];
        
        try {
          contacts = await apiService.getCustomerContacts(decodedCustomerId);
          console.log('Contacts loaded:', contacts);
        } catch (contactError) {
          console.warn('Could not load contacts:', contactError);
        }
        
        try {
          addresses = await apiService.getCustomerAddresses(decodedCustomerId);
          console.log('Addresses loaded:', addresses);
        } catch (addressError) {
          console.warn('Could not load addresses:', addressError);
        }

        console.log('Setting form data with:', {
          customer_name: customer.customer_name,
          customer_group: customer.customer_group,
          contactsCount: contacts.length,
          addressesCount: addresses.length
        });

        setFormData({
          customer_id: decodedCustomerId,
          customer_name: customer.customer_name || '',
          customer_group: customer.customer_group || '',
          contacts: contacts.length > 0 
            ? contacts.map(c => ({
                id: c.name,
                first_name: c.first_name || '',
                email_id: c.email_id || '',
                mobile_no: c.mobile_no || '',
                phone: c.phone || '',
                isNew: false,
              }))
            : [{
                id: undefined,
                first_name: '',
                email_id: '',
                mobile_no: '',
                phone: '',
                isNew: true,
              }],
          addresses: addresses.length > 0
            ? addresses.map(a => ({
                id: a.name,
                address_title: a.address_title || '',
                address_line1: a.address_line1 || '',
                address_line2: a.address_line2 || '',
                city: a.city || '',
                state: a.state || '',
                pincode: a.pincode || '',
                country: a.country || 'Egypt',
                latitude: (a as any).latitude || '',
                longitude: (a as any).longitude || '',
                isNew: false,
              }))
            : [],
        });
      } catch (error) {
        console.error('Error loading customer data:', error);
        notifications.show({
          title: 'Error',
          message: `Failed to load customer data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
      } finally {
        console.log('Loading complete, setting isLoadingData to false');
        setIsLoadingData(false);
      }
    };

    loadCustomerData();
  }, [customerId, navigate]);

  const handleContactChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleAddressChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((address, i) =>
        i === index ? { ...address, [field]: value } : address
      )
    }));
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: undefined,
          first_name: '',
          email_id: '',
          mobile_no: '',
          phone: '',
          isNew: true,
        }
      ]
    }));
  };

  const removeContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
                {
          id: undefined,
          address_title: `${formData.customer_name} - Address ${prev.addresses.length + 1}`,                                                                    
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'Egypt',
          latitude: '',
          longitude: '',
          isNew: true,
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
    setIsLoading(true);
    try {
      // Process contacts
      for (const contact of formData.contacts) {
        if (!contact.email_id && !contact.mobile_no && !contact.phone) {
          continue; // Skip empty contacts
        }

        if (contact.isNew) {
          // Create new contact
          const contactData = {
            doctype: 'Contact',
            first_name: contact.first_name || formData.customer_name,
            email_id: contact.email_id || '',
            mobile_no: contact.mobile_no || '',
            phone: contact.phone || '',
            is_primary_contact: formData.contacts.indexOf(contact) === 0 ? 1 : 0,
            links: [{
              link_doctype: 'Customer',
              link_name: formData.customer_id
            }]
          };
          await apiService.createContact(contactData);
          console.log('Contact created');
        } else if (contact.id) {
          // Update existing contact
          const contactData = {
            first_name: contact.first_name || formData.customer_name,
            email_id: contact.email_id || '',
            mobile_no: contact.mobile_no || '',
            phone: contact.phone || '',
            is_primary_contact: formData.contacts.indexOf(contact) === 0 ? 1 : 0,
          };
          await apiService.updateContact(contact.id, contactData);
          console.log('Contact updated');
        }
      }

      // Process deleted contacts (those that were in DB but not in current state)
      // Note: We'd need to track original contacts separately for this
      // For simplicity, we'll skip deletion for now

      // Process addresses
      for (const address of formData.addresses) {
        if (!address.address_line1 && !address.city) {
          continue; // Skip empty addresses
        }

        if (address.isNew) {
                    // Create new address
          const addressData = {
            doctype: 'Address',
            address_title: address.address_title || `${formData.customer_name} - Address`,                                                                      
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'Egypt',
            latitude: address.latitude || '',
            longitude: address.longitude || '',
            is_primary_address: formData.addresses.indexOf(address) === 0 ? 1 : 0,                                                                              
            is_shipping_address: 1,
            links: [{
              link_doctype: 'Customer',
              link_name: formData.customer_id
            }]
          };
          await apiService.createAddress(addressData);
          console.log('Address created');
        } else if (address.id) {
                    // Update existing address
          const addressData = {
            address_title: address.address_title || `${formData.customer_name} - Address`,                                                                      
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'Egypt',
            latitude: address.latitude || '',
            longitude: address.longitude || '',
            is_primary_address: formData.addresses.indexOf(address) === 0 ? 1 : 0,                                                                              
          };
          await apiService.updateAddress(address.id, addressData);
          console.log('Address updated');
        }
      }

      notifications.show({
        title: 'Customer Updated',
        message: `${formData.customer_name} has been updated successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Navigate back
      navigate(-1);
    } catch (error) {
      console.error('Error updating customer:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update customer. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const customerGroups = posProfile?.customer_groups?.map(g => g.customer_group) || [];

  if (isLoadingData) {
    return (
      <Center style={{ minHeight: '50vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

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
          <IconUserEdit size={32} />
          <div>
            <Title order={1} c="white" mb="xs">Edit Customer</Title>
            <Text c="white" size="sm" opacity={0.9}>
              Update contact and address information for {formData.customer_name}
            </Text>
          </div>
        </Group>
      </div>

      <div style={{ margin: '0.06rem', padding: '0.06rem' }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Basic Information (Read-only) */}
              <Card style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef'
              }}>
                <Group mb="md">
                  <IconUserEdit size={20} color="#667eea" />
                  <Text fw={600} size="lg" c="#495057">Customer Information</Text>
                  <Badge color="gray" variant="light">Read Only</Badge>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Customer Name"
                      value={formData.customer_name}
                      disabled
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Customer Group"
                      value={formData.customer_group}
                      data={customerGroups}
                      disabled
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
                    {formData.contacts.length > 1 && (
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
                Add Another Address
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
                <Text fw={600} size="lg" mb="md" c="#495057">Update Summary</Text>
                
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
                    <Text size="sm">{formData.contacts.length} contact(s) configured</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" c="dimmed">Addresses</Text>
                    <Text size="sm">{formData.addresses.length} address(es) configured</Text>
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
                    disabled={isLoading}
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
                    {isLoading ? 'Saving Changes...' : 'Save Changes'}
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
                  Customer name and group are read-only. You can add, edit, or remove contacts and addresses.
                </Text>
              </Alert>
            </Stack>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}


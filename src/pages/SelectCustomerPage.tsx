import { useState, useEffect } from 'react';
import { apiService, type Customer } from '../services/apiService';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNavigate } from 'react-router-dom';
import { Title, TextInput, ScrollArea, Table, Loader, Center, Text, Paper } from '@mantine/core';

export function SelectCustomerPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const setCustomer = useCartStore((state) => state.setCustomer);
  const { posProfile } = useSettingsStore();

  useEffect(() => {
    if (posProfile) {
      setIsLoading(true);
      const customerGroups = posProfile.customer_groups.map(g => g.customer_group);
      apiService.getCustomers(customerGroups)
        .then(data => {
          setCustomers(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [posProfile]);

  const handleSelectCustomer = (customer: Customer) => {
    setCustomer(customer);
    navigate(-1); // Go back to the previous page (the cart)
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  const rows = filteredCustomers.map((customer) => (
    <Table.Tr key={customer.name} onClick={() => handleSelectCustomer(customer)} style={{ cursor: 'pointer' }}>
      <Table.Td>{customer.customer_name}</Table.Td>
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>{customer.customer_group}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Title order={1} mb="md">Select a Customer</Title>
      <TextInput
        placeholder="Search for a customer..."
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Paper withBorder>
        <ScrollArea h="calc(100vh - 200px)">
          {isLoading && <Center><Loader /></Center>}
          {!isLoading && filteredCustomers.length === 0 && <Center p="md"><Text>No customers found.</Text></Center>}
          {!isLoading && filteredCustomers.length > 0 && (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Customer Name</Table.Th>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Group</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Paper>
    </>
  );
}

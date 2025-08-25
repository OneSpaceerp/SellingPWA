import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '../db/db';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import { Title, TextInput, ScrollArea, Table, Loader, Center, Text, Paper } from '@mantine/core';

export function SelectCustomerPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const setCustomer = useCartStore((state) => state.setCustomer);

  const customers = useLiveQuery(async () => {
    const allCustomers = await db.customers.toArray();
    if (!search) {
      return allCustomers;
    }
    return allCustomers.filter(customer =>
      customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleSelectCustomer = (customer: Customer) => {
    setCustomer(customer.name);
    navigate(-1); // Go back to the previous page (the cart)
  };

  const rows = customers?.map((customer) => (
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
          {customers === undefined && <Center><Loader /></Center>}
          {customers && customers.length === 0 && <Center p="md"><Text>No customers found.</Text></Center>}
          {customers && customers.length > 0 && (
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

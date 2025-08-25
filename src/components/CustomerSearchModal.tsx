import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '../db/db';
import { Modal, TextInput, ScrollArea, Table, Loader, Center, Text } from '@mantine/core';

interface CustomerSearchModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerSearchModal({ opened, onClose, onSelect }: CustomerSearchModalProps) {
  const [search, setSearch] = useState('');

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
    onSelect(customer);
    onClose();
  };

  const rows = customers?.map((customer) => (
    <Table.Tr key={customer.name} onClick={() => handleSelectCustomer(customer)} style={{ cursor: 'pointer' }}>
      <Table.Td>{customer.customer_name}</Table.Td>
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>{customer.customer_group}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Modal opened={opened} onClose={onClose} title="Select a Customer" size="xl" zIndex={2000}>
      <TextInput
        placeholder="Search for a customer..."
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <ScrollArea h={400}>
        {customers === undefined && <Center><Loader /></Center>}
        {customers && customers.length === 0 && <Center><Text>No customers found.</Text></Center>}
        {customers && customers.length > 0 && (
          <Table striped highlightOnHover>
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
    </Modal>
  );
}

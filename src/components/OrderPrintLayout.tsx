import { forwardRef } from 'react';
import type { SalesOrder } from '../services/apiService';
import { Title, Text, Group, Table, Stack, Divider } from '@mantine/core';

interface OrderPrintLayoutProps {
  order: SalesOrder;
  currency: string;
}

export const OrderPrintLayout = forwardRef<HTMLDivElement, OrderPrintLayoutProps>(({ order, currency }, ref) => {
  const paidAmount = order.grand_total - order.outstanding_amount;

  return (
    <div ref={ref} style={{ padding: '20px' }}>
      <Stack>
        <Title order={2}>Order: {order.name}</Title>
        <Group justify="space-between">
          <Text>Customer:</Text>
          <Text fw={500}>{order.customer_name || order.customer}</Text>
        </Group>
        <Group justify="space-between">
          <Text>Date:</Text>
          <Text>{new Date(order.creation).toLocaleString()}</Text>
        </Group>
      </Stack>

      <Divider my="md" />

      <Title order={4} mb="sm">Items</Title>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Item</Table.Th>
            <Table.Th>Qty</Table.Th>
            <Table.Th>Rate</Table.Th>
            <Table.Th>Total</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {order.items && order.items.map(item => (
            <Table.Tr key={item.item_code}>
              <Table.Td>{item.item_name}</Table.Td>
              <Table.Td>{item.qty}</Table.Td>
              <Table.Td>{currency} {item.rate.toFixed(2)}</Table.Td>
              <Table.Td>{currency} {(item.qty * item.rate).toFixed(2)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Divider my="md" />

      <Stack>
        <Group justify="space-between">
          <Text>Grand Total:</Text>
          <Text fw={700}>{currency} {order.grand_total.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between">
          <Text>Paid Amount:</Text>
          <Text c="teal">{currency} {paidAmount.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between">
          <Text>Outstanding:</Text>
          <Text c="orange">{currency} {order.outstanding_amount.toFixed(2)}</Text>
        </Group>
      </Stack>
    </div>
  );
});

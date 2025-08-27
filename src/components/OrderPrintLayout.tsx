import { forwardRef } from 'react';
import type { Order } from '../db/Order';
import { Title, Text, Group, Table, Stack, Divider } from '@mantine/core';

interface OrderPrintLayoutProps {
  order: Order;
  currency: string;
}

export const OrderPrintLayout = forwardRef<HTMLDivElement, OrderPrintLayoutProps>(({ order, currency }, ref) => {
  return (
    <div ref={ref} style={{ padding: '20px' }}>
      <Stack>
        <Title order={2}>Order: {order.order_id}</Title>
        <Group justify="space-between">
          <Text>Customer:</Text>
          <Text fw={500}>{order.customer}</Text>
        </Group>
        <Group justify="space-between">
          <Text>Date:</Text>
          <Text>{new Date(order.created_at).toLocaleString()}</Text>
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
          {order.items.map(item => (
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
          <Text c="teal">{currency} {order.paid_amount.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between">
          <Text>Outstanding:</Text>
          <Text c="orange">{currency} {order.outstanding_amount.toFixed(2)}</Text>
        </Group>
      </Stack>
    </div>
  );
});

import { Title, Text, Paper } from '@mantine/core';
import { useParams } from 'react-router-dom';

export function PaymentPage() {
  const { orderId } = useParams();

  return (
    <Paper p="md">
      <Title order={1}>Complete Payment</Title>
      <Text mt="md">This is the payment page for order: <strong>{orderId}</strong></Text>
      <Text mt="sm">This feature is not yet fully implemented.</Text>
    </Paper>
  );
}

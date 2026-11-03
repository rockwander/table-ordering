import { OrderStatus } from '@/types';

// Not yet accepted by the kitchen (accepting sets status to 'ready')
export const isNewOrder = (order: { status: OrderStatus }) =>
  order.status !== 'ready' &&
  order.status !== 'served' &&
  order.status !== 'bill_requested' &&
  order.status !== 'paid';

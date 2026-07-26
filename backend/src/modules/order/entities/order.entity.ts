import { z } from 'zod';
import {
  DeliveryMethod,
  OrderLineArtStatus,
  OrderPipelineStatus,
} from '../../../common/schemas/order.schema';
import { CardColor, CardType, Tcg } from '../../../common/schemas/tcg.schema';
import { OrderPaymentEntity } from './order-payment.entity';

export const OrderCardSnapshot = z.object({
  id: z.number(),
  tcg: Tcg,
  card_type: CardType,
  name: z.string().nullable(),
  edition: z.string().nullable(),
  colors: z.array(CardColor),
});

export const OrderCustomerSummary = z.object({
  id: z.number(),
  name: z.string(),
  state: z.string().nullable(),
});

export const OrderPrintModelSnapshot = z.object({
  id: z.number(),
  name: z.string(),
  file_name: z.string(),
});

export const OrderItemEntity = z.object({
  id: z.number(),
  card_id: z.number(),
  card_print_model_id: z.number().nullable(),
  customer_gift_id: z.number().nullable(),
  fulfill_from_stock: z.boolean(),
  has_varnish: z.boolean(),
  production_shipment_id: z.number().nullable(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot.nullable(),
});

export const OrderEntity = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer: OrderCustomerSummary,
  order_status: OrderPipelineStatus,
  delivery_method: DeliveryMethod.nullable(),
  notes: z.string().nullable(),
  order_date: z.date(),
  total_amount: z.number(),
  amount_paid: z.number(),
  amount_due: z.number(),
  is_fully_paid: z.boolean(),
  payments: z.array(OrderPaymentEntity),
  items: z.array(OrderItemEntity),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export const OrderSummaryLineEntity = z.object({
  id: z.number(),
  card_print_model_id: z.number().nullable(),
  customer_gift_id: z.number().nullable(),
  fulfill_from_stock: z.boolean(),
  has_varnish: z.boolean(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot.nullable(),
});

export const OrderSummaryEntity = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer_name: z.string(),
  customer_state: z.string().nullable(),
  order_status: OrderPipelineStatus,
  delivery_method: DeliveryMethod.nullable(),
  notes: z.string().nullable(),
  order_date: z.date(),
  total_amount: z.number(),
  amount_paid: z.number(),
  amount_due: z.number(),
  is_fully_paid: z.boolean(),
  item_count: z.number(),
  pending_production_count: z.number(),
  missing_print_model_count: z.number(),
  lines_without_model_count: z.number(),
  lines: z.array(OrderSummaryLineEntity),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TOrderEntity = z.infer<typeof OrderEntity>;
export type TOrderSummaryEntity = z.infer<typeof OrderSummaryEntity>;

import { z } from 'zod';
import {
  DeliveryMethod,
  OrderLineArtStatus,
  OrderPipelineStatus,
} from '../../../common/schemas/order.schema';
import { CardColor, CardType, Tcg } from '../../../common/schemas/tcg.schema';

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
});

export const OrderPrintModelSnapshot = z.object({
  id: z.number(),
  name: z.string(),
  file_name: z.string(),
});

export const OrderItemEntity = z.object({
  id: z.number(),
  card_id: z.number(),
  card_print_model_id: z.number(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot,
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
  items: z.array(OrderItemEntity),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export const OrderSummaryLineEntity = z.object({
  id: z.number(),
  card_print_model_id: z.number(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot,
});

export const OrderSummaryEntity = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer_name: z.string(),
  order_status: OrderPipelineStatus,
  delivery_method: DeliveryMethod.nullable(),
  notes: z.string().nullable(),
  order_date: z.date(),
  total_amount: z.number(),
  item_count: z.number(),
  lines: z.array(OrderSummaryLineEntity),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TOrderEntity = z.infer<typeof OrderEntity>;
export type TOrderSummaryEntity = z.infer<typeof OrderSummaryEntity>;

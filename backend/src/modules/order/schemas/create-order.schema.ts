import { z } from 'zod';

import { ErrorResponse } from '../../../common/schemas/error-response.schema';

import {
  DeliveryMethod,
  OrderDateInput,
  OrderItemInput,
  OrderPipelineStatus,
} from '../../../common/schemas/order.schema';

import { OrderEntity } from '../entities/order.entity';

export const CreateOrderBody = z.object({
  customer_id: z.coerce.number().int().positive(),
  order_date: OrderDateInput,
  order_status: OrderPipelineStatus.optional(),
  delivery_method: DeliveryMethod.nullable().optional(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(OrderItemInput).min(1, 'Adicione ao menos uma carta ao pedido.'),
});

export type TCreateOrderBody = z.infer<typeof CreateOrderBody>;

export const CreateOrderResponse = OrderEntity;

export type TCreateOrderResponse = z.infer<typeof CreateOrderResponse>;

export const CreateOrderSchema = {
  body: CreateOrderBody,
  response: {
    201: CreateOrderResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Cria um pedido com itens vinculados ao catálogo.',
  tags: ['Order'],
};

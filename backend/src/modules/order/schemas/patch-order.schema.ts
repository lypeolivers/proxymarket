import { z } from 'zod';

import { ErrorResponse } from '../../../common/schemas/error-response.schema';

import { DeliveryMethod, OrderDateInput, OrderPipelineStatus } from '../../../common/schemas/order.schema';

import { OrderEntity } from '../entities/order.entity';

export const PatchOrderParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TPatchOrderParams = z.infer<typeof PatchOrderParams>;

export const PatchOrderBody = z
  .object({
    order_status: OrderPipelineStatus.optional(),
    order_date: OrderDateInput.optional(),
    delivery_method: DeliveryMethod.nullable().optional(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) =>
      data.order_status !== undefined ||
      data.order_date !== undefined ||
      data.delivery_method !== undefined ||
      data.notes !== undefined,
    'Informe ao menos um campo para atualizar.'
  );

export type TPatchOrderBody = z.infer<typeof PatchOrderBody>;

export const PatchOrderResponse = OrderEntity;

export type TPatchOrderResponse = z.infer<typeof PatchOrderResponse>;

export const PatchOrderSchema = {
  params: PatchOrderParams,
  body: PatchOrderBody,
  response: {
    200: PatchOrderResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza parcialmente o cabeçalho do pedido.',
  tags: ['Order'],
};

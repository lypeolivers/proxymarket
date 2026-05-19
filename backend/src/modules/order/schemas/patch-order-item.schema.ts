import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { MoneyAmount } from '../../../common/schemas/order.schema';
import { OrderEntity } from '../entities/order.entity';

export const PatchOrderItemParams = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export type TPatchOrderItemParams = z.infer<typeof PatchOrderItemParams>;

export const PatchOrderItemBody = z
  .object({
    quantity: z.coerce.number().int().min(1, 'A quantidade mínima é 1.').optional(),
    unit_price: MoneyAmount.optional(),
  })
  .refine(
    (data) => data.quantity !== undefined || data.unit_price !== undefined,
    'Informe ao menos um campo para atualizar.'
  );

export type TPatchOrderItemBody = z.infer<typeof PatchOrderItemBody>;

export const PatchOrderItemResponse = OrderEntity;
export type TPatchOrderItemResponse = z.infer<typeof PatchOrderItemResponse>;

export const PatchOrderItemSchema = {
  params: PatchOrderItemParams,
  body: PatchOrderItemBody,
  response: {
    200: PatchOrderItemResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza parcialmente um item do pedido.',
  tags: ['Order'],
};

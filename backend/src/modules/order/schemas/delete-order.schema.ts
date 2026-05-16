import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const DeleteOrderParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TDeleteOrderParams = z.infer<typeof DeleteOrderParams>;

export const DeleteOrderResponse = z.object({
  id: z.number(),
});

export type TDeleteOrderResponse = z.infer<typeof DeleteOrderResponse>;

export const DeleteOrderSchema = {
  params: DeleteOrderParams,
  response: {
    200: DeleteOrderResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Remove um pedido e seus itens (soft delete).',
  tags: ['Order'],
};

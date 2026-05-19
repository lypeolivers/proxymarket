import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const MoveProductionOrderItemParams = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export type TMoveProductionOrderItemParams = z.infer<typeof MoveProductionOrderItemParams>;

export const MoveProductionOrderItemResponse = z.object({
  ok: z.literal(true),
});

export type TMoveProductionOrderItemResponse = z.infer<typeof MoveProductionOrderItemResponse>;

export const MoveProductionOrderItemSchema = {
  params: MoveProductionOrderItemParams,
  response: {
    200: MoveProductionOrderItemResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Move um item de pedido para outra remessa (mesmo destino é ignorado).',
  tags: ['Production'],
};

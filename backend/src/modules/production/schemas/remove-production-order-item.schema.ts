import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const RemoveProductionOrderItemParams = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export type TRemoveProductionOrderItemParams = z.infer<typeof RemoveProductionOrderItemParams>;

export const RemoveProductionOrderItemResponse = z.object({
  ok: z.literal(true),
});

export type TRemoveProductionOrderItemResponse = z.infer<typeof RemoveProductionOrderItemResponse>;

export const RemoveProductionOrderItemSchema = {
  params: RemoveProductionOrderItemParams,
  response: {
    200: RemoveProductionOrderItemResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description:
    'Remove o item da remessa de produção (linha permanece no pedido, fora da fila da gráfica).',
  tags: ['Production'],
};

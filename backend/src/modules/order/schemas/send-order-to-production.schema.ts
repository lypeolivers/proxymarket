import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { OrderEntity } from '../entities/order.entity';

export const SendOrderToProductionParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TSendOrderToProductionParams = z.infer<typeof SendOrderToProductionParams>;

export const SendOrderToProductionResponse = OrderEntity;

export type TSendOrderToProductionResponse = z.infer<typeof SendOrderToProductionResponse>;

export const SendOrderToProductionSchema = {
  params: SendOrderToProductionParams,
  response: {
    200: SendOrderToProductionResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
    409: ErrorResponse,
  },
  description:
    'Envia linhas pendentes (sem remessa) do pedido para a remessa em aguardando impressão.',
  tags: ['Order'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { OrderEntity } from '../entities/order.entity';

export const GetOrderParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TGetOrderParams = z.infer<typeof GetOrderParams>;

export const GetOrderResponse = OrderEntity;
export type TGetOrderResponse = z.infer<typeof GetOrderResponse>;

export const GetOrderSchema = {
  params: GetOrderParams,
  response: {
    200: GetOrderResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Busca um pedido com itens e cliente.',
  tags: ['Order'],
};

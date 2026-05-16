import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { OrderEntity } from '../entities/order.entity';
import { CreateOrderBody } from './create-order.schema';

export const UpdateOrderParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TUpdateOrderParams = z.infer<typeof UpdateOrderParams>;

export const UpdateOrderBody = CreateOrderBody;
export type TUpdateOrderBody = z.infer<typeof UpdateOrderBody>;

export const UpdateOrderResponse = OrderEntity;
export type TUpdateOrderResponse = z.infer<typeof UpdateOrderResponse>;

export const UpdateOrderSchema = {
  params: UpdateOrderParams,
  body: UpdateOrderBody,
  response: {
    200: UpdateOrderResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza um pedido e substitui todos os itens.',
  tags: ['Order'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { OrderPaymentEntity } from '../entities/order-payment.entity';

export const ListOrderPaymentsParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TListOrderPaymentsParams = z.infer<typeof ListOrderPaymentsParams>;

export const ListOrderPaymentsResponse = z.object({
  items: z.array(OrderPaymentEntity),
});

export type TListOrderPaymentsResponse = z.infer<typeof ListOrderPaymentsResponse>;

export const ListOrderPaymentsSchema = {
  params: ListOrderPaymentsParams,
  response: {
    200: ListOrderPaymentsResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Lista pagamentos registrados no pedido.',
  tags: ['Order'],
};

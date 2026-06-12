import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const DeleteOrderPaymentParams = z.object({
  id: z.coerce.number().int().positive(),
  paymentId: z.coerce.number().int().positive(),
});

export type TDeleteOrderPaymentParams = z.infer<typeof DeleteOrderPaymentParams>;

export const DeleteOrderPaymentResponse = z.object({
  success: z.literal(true),
});

export type TDeleteOrderPaymentResponse = z.infer<typeof DeleteOrderPaymentResponse>;

export const DeleteOrderPaymentSchema = {
  params: DeleteOrderPaymentParams,
  response: {
    200: DeleteOrderPaymentResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Remove (soft delete) um lançamento de pagamento do pedido.',
  tags: ['Order'],
};

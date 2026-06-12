import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { MoneyAmount, OrderDateInput } from '../../../common/schemas/order.schema';
import { OrderPaymentEntity } from '../entities/order-payment.entity';

export const CreateOrderPaymentParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const CreateOrderPaymentBody = z.object({
  amount: MoneyAmount,
  collected_at: OrderDateInput,
  notes: z.string().trim().optional().nullable(),
});

export type TCreateOrderPaymentParams = z.infer<typeof CreateOrderPaymentParams>;
export type TCreateOrderPaymentBody = z.infer<typeof CreateOrderPaymentBody>;

export const CreateOrderPaymentResponse = OrderPaymentEntity;
export type TCreateOrderPaymentResponse = z.infer<typeof CreateOrderPaymentResponse>;

export const CreateOrderPaymentSchema = {
  params: CreateOrderPaymentParams,
  body: CreateOrderPaymentBody,
  response: {
    201: CreateOrderPaymentResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Registra um pagamento recebido no pedido.',
  tags: ['Order'],
};

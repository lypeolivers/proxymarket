import { z } from 'zod';

export const OrderPaymentEntity = z.object({
  id: z.number(),
  amount: z.number(),
  collected_at: z.date(),
  notes: z.string().nullable(),
  created_at: z.date(),
});

export type TOrderPaymentEntity = z.infer<typeof OrderPaymentEntity>;

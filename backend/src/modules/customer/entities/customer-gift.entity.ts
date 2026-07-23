import { z } from 'zod';

export const CustomerGiftEntity = z.object({
  id: z.number(),
  customer_id: z.number(),
  quantity_granted: z.number(),
  quantity_used: z.number(),
  quantity_remaining: z.number(),
  notes: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TCustomerGiftEntity = z.infer<typeof CustomerGiftEntity>;

export function mapCustomerGiftRecord(gift: {
  id: number;
  customer_id: number;
  quantity_granted: number;
  quantity_used: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}): TCustomerGiftEntity {
  return CustomerGiftEntity.parse({
    ...gift,
    quantity_remaining: Math.max(0, gift.quantity_granted - gift.quantity_used),
  });
}

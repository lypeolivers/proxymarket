import { z } from 'zod';

export const CustomerEntity = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  notes: z.string().nullable(),
  gift_units_remaining: z.number().optional(),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TCustomerEntity = z.infer<typeof CustomerEntity>;

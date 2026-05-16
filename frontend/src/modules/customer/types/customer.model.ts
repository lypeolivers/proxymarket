import { z } from 'zod'

import { BRAZIL_UF_CODES } from '@/lib/brazil-regions'

/** espelho do enum de UF do backend */
export const BrazilUfZod = z.enum(BRAZIL_UF_CODES)

export const Customer = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TCustomer = z.infer<typeof Customer>

export const CustomerBody = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  city: z.union([z.string().trim().max(120), z.null()]).optional(),
  state: z.union([BrazilUfZod, z.null()]).optional(),
  notes: z.string().trim().optional().nullable(),
})

export type TCustomerBody = z.infer<typeof CustomerBody>

export const ListCustomersResponse = z.object({
  items: z.array(Customer),
  pagination: z.object({
    total: z.number(),
    pages: z.number(),
  }),
})

export type TListCustomersResponse = z.infer<typeof ListCustomersResponse>

export const DeleteCustomerResponse = z.object({
  id: z.number(),
})

export type TDeleteCustomerResponse = z.infer<typeof DeleteCustomerResponse>

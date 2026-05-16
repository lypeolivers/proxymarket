import { z } from 'zod'

export const Status = z.enum(['active', 'inactive', 'blocked', 'pending'])

export const User = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  status: Status,
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional().nullable(),
})

export const UpdateMeBody = User.pick({
  name: true,
  email: true,
})
  .extend({
    password: z.string().min(8).optional(),
  })
  .partial()

export type TUser = z.infer<typeof User>
export type TUpdateMeBody = z.infer<typeof UpdateMeBody>

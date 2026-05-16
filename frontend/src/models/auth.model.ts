import { z } from 'zod'

export const User = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional().nullable(),
  status: z.string(),
})

export const SigninResponse = User.partial()

export type TUser = z.infer<typeof User>
export type TSigninResponse = z.infer<typeof SigninResponse>

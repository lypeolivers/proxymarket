import { z } from 'zod';
import { Status } from '../../../common/schemas/status.schema';

export const UserEntity = z.object({
  id: z.number().nullable().optional(),
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8).nullable().optional(),
  status: Status,
  refresh_token: z.string().optional().nullable(),
  created_at: z.date(),
  updated_at: z.date().optional().nullable(),
});

export type TUserEntity = z.infer<typeof UserEntity>;

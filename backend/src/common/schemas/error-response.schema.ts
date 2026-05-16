import { z } from 'zod';

export const ErrorResponse = z.object({
  code: z.string().optional(),
  message: z.string(),
});

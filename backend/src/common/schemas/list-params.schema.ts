import { z } from 'zod';

export const ListParams = z.object({
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  sort_by: z.string().optional(),
  sort: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
});

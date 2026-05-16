import { z } from 'zod';

export const Pagination = z.object({
  total: z.number(),
  pages: z.number(),
});

export type TPagination = z.infer<typeof Pagination>;

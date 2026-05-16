import { z } from 'zod';

export const HealthResponse = z.string();

export type THealthResponse = z.infer<typeof HealthResponse>;

export const HealthSchema = {
  response: {
    200: HealthResponse,
  },
  description: 'Health check',
  tags: ['Health'],
};

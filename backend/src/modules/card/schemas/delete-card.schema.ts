import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const DeleteCardParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TDeleteCardParams = z.infer<typeof DeleteCardParams>;

export const DeleteCardResponse = z.object({
  id: z.number(),
});

export type TDeleteCardResponse = z.infer<typeof DeleteCardResponse>;

export const DeleteCardSchema = {
  params: DeleteCardParams,
  response: {
    200: DeleteCardResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Remove uma carta do catálogo (soft delete).',
  tags: ['Card'],
};

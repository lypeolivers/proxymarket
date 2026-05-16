import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardEntity } from '../entities/card.entity';

export const GetCardParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TGetCardParams = z.infer<typeof GetCardParams>;

export const GetCardResponse = CardEntity;
export type TGetCardResponse = z.infer<typeof GetCardResponse>;

export const GetCardSchema = {
  params: GetCardParams,
  response: {
    200: GetCardResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Retorna uma carta do catálogo pelo id.',
  tags: ['Card'],
};

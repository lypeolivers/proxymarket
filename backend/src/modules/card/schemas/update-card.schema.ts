import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardEntity } from '../entities/card.entity';
import { CreateCardBody } from './create-card.schema';

export const UpdateCardParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TUpdateCardParams = z.infer<typeof UpdateCardParams>;

export const UpdateCardBody = CreateCardBody;
export type TUpdateCardBody = z.infer<typeof UpdateCardBody>;

export const UpdateCardResponse = CardEntity;
export type TUpdateCardResponse = z.infer<typeof UpdateCardResponse>;

export const UpdateCardSchema = {
  params: UpdateCardParams,
  body: UpdateCardBody,
  response: {
    200: UpdateCardResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza uma carta do catálogo (substituição completa).',
  tags: ['Card'],
};

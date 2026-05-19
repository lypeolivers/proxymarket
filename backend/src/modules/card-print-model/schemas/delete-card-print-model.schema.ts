import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const DeleteCardPrintModelParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TDeleteCardPrintModelParams = z.infer<typeof DeleteCardPrintModelParams>;

export const DeleteCardPrintModelResponse = z.object({
  id: z.number(),
});

export type TDeleteCardPrintModelResponse = z.infer<typeof DeleteCardPrintModelResponse>;

export const DeleteCardPrintModelSchema = {
  params: DeleteCardPrintModelParams,
  response: {
    200: DeleteCardPrintModelResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Remove um modelo de impressão (soft delete).',
  tags: ['CardPrintModel'],
};

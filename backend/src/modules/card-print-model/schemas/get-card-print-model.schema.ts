import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardPrintModelEntity } from '../entities/card-print-model.entity';

export const GetCardPrintModelParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TGetCardPrintModelParams = z.infer<typeof GetCardPrintModelParams>;

export const GetCardPrintModelResponse = CardPrintModelEntity;

export type TGetCardPrintModelResponse = z.infer<typeof GetCardPrintModelResponse>;

export const GetCardPrintModelSchema = {
  params: GetCardPrintModelParams,
  response: {
    200: GetCardPrintModelResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Detalhe de um modelo de impressão.',
  tags: ['CardPrintModel'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardPrintModelEntity } from '../entities/card-print-model.entity';

export const UpdateCardPrintModelParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TUpdateCardPrintModelParams = z.infer<typeof UpdateCardPrintModelParams>;

export const UpdateCardPrintModelBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    file_name: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.name !== undefined || data.file_name !== undefined, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export type TUpdateCardPrintModelBody = z.infer<typeof UpdateCardPrintModelBody>;

export const UpdateCardPrintModelResponse = CardPrintModelEntity;

export type TUpdateCardPrintModelResponse = z.infer<typeof UpdateCardPrintModelResponse>;

export const UpdateCardPrintModelSchema = {
  params: UpdateCardPrintModelParams,
  body: UpdateCardPrintModelBody,
  response: {
    200: UpdateCardPrintModelResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza nome do modelo e/ou arquivo.',
  tags: ['CardPrintModel'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardPrintModelEntity } from '../entities/card-print-model.entity';

export const CreateCardPrintModelBody = z.object({
  card_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, 'Informe o nome do modelo.'),
  file_name: z.string().trim().min(1, 'Informe o nome do arquivo.'),
});

export type TCreateCardPrintModelBody = z.infer<typeof CreateCardPrintModelBody>;

export const CreateCardPrintModelResponse = CardPrintModelEntity;

export type TCreateCardPrintModelResponse = z.infer<typeof CreateCardPrintModelResponse>;

export const CreateCardPrintModelSchema = {
  body: CreateCardPrintModelBody,
  response: {
    201: CreateCardPrintModelResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Cadastra um modelo de impressão para uma carta.',
  tags: ['CardPrintModel'],
};

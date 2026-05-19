import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardEntity } from '../../card/entities/card.entity';

export const GraphicSummaryLineEntity = z.object({
  card: CardEntity,
  quantity: z.number().int(),
});

export type TGraphicSummaryLineEntity = z.infer<typeof GraphicSummaryLineEntity>;

export const GraphicSummaryResponse = z.object({
  lines: z.array(GraphicSummaryLineEntity),
  total_units: z.number().int(),
  clipboard_text: z.string(),
  generated_at: z.date(),
});

export type TGraphicSummaryResponse = z.infer<typeof GraphicSummaryResponse>;

export const GraphicSummarySchema = {
  response: {
    200: GraphicSummaryResponse,
    401: ErrorResponse,
  },
  description:
    'Lista consolidada do que falta enviar à gráfica (demanda sem linhas em impressão/impressas, menos estoque). Inclui texto pronto para área de transferência.',
  tags: ['Stock'],
};

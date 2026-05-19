import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CardEntity } from '../../card/entities/card.entity';

export const ProductionGraphicSummaryParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TProductionGraphicSummaryParams = z.infer<typeof ProductionGraphicSummaryParams>;

export const ProductionGraphicSummaryLineEntity = z.object({
  card: CardEntity,
  quantity: z.number().int(),
});

export const ProductionGraphicSummaryResponse = z.object({
  lines: z.array(ProductionGraphicSummaryLineEntity),
  total_units: z.number().int(),
  clipboard_text: z.string(),
  generated_at: z.date(),
});

export type TProductionGraphicSummaryResponse = z.infer<
  typeof ProductionGraphicSummaryResponse
>;

export const ProductionGraphicSummarySchema = {
  params: ProductionGraphicSummaryParams,
  response: {
    200: ProductionGraphicSummaryResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Resumo para gráfica consolidado por remessa (quantidades por modelo de impressão).',
  tags: ['Production'],
};

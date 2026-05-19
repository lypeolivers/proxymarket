import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { StockRowEntity } from '../entities/stock-row.entity';

export const PatchStockParams = z.object({
  cardId: z.coerce.number().int().positive(),
});

export type TPatchStockParams = z.infer<typeof PatchStockParams>;

export const PatchStockBody = z.object({
  quantity: z.number().int().min(0),
});

export type TPatchStockBody = z.infer<typeof PatchStockBody>;

export const PatchStockResponse = StockRowEntity;

export type TPatchStockResponse = z.infer<typeof PatchStockResponse>;

export const PatchStockSchema = {
  params: PatchStockParams,
  body: PatchStockBody,
  response: {
    200: PatchStockResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Define o saldo em estoque (unidades prontas) para uma carta do catálogo.',
  tags: ['Stock'],
};

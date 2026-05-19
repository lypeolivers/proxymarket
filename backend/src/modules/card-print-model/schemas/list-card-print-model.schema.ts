import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ListParams } from '../../../common/schemas/list-params.schema';
import { Pagination } from '../../../common/schemas/pagination.schema';
import { Tcg } from '../../../common/schemas/tcg.schema';
import { CardPrintModelListRow } from '../entities/card-print-model.entity';

export const ListCardPrintModelQuery = ListParams.extend({
  card_id: z.coerce.number().int().positive().optional(),
  tcg: Tcg.optional(),
});

export type TListCardPrintModelQuery = z.infer<typeof ListCardPrintModelQuery>;

export const ListCardPrintModelResponse = z.object({
  items: z.array(CardPrintModelListRow),
  pagination: Pagination,
});

export type TListCardPrintModelResponse = z.infer<typeof ListCardPrintModelResponse>;

export const ListCardPrintModelSchema = {
  querystring: ListCardPrintModelQuery,
  response: {
    200: ListCardPrintModelResponse,
    401: ErrorResponse,
  },
  description:
    'Lista modelos de impressão (filtro opcional por carta, TCG e texto em nome/arquivo do modelo ou nome da carta).',
  tags: ['CardPrintModel'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ListParams } from '../../../common/schemas/list-params.schema';
import { Pagination } from '../../../common/schemas/pagination.schema';
import { Tcg } from '../../../common/schemas/tcg.schema';
import { CardEntity } from '../entities/card.entity';

export const ListCardsQuery = ListParams.extend({
  tcg: Tcg.optional(),
});

export type TListCardsQuery = z.infer<typeof ListCardsQuery>;

export const ListCardsResponse = z.object({
  items: z.array(CardEntity),
  pagination: Pagination,
});

export type TListCardsResponse = z.infer<typeof ListCardsResponse>;

export const ListCardsSchema = {
  querystring: ListCardsQuery,
  response: {
    200: ListCardsResponse,
    401: ErrorResponse,
  },
  description: 'Lista as cartas do catálogo (paginação + filtro opcional por TCG).',
  tags: ['Card'],
};

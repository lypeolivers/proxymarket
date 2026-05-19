import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ListParams } from '../../../common/schemas/list-params.schema';
import { Pagination } from '../../../common/schemas/pagination.schema';
import { Tcg } from '../../../common/schemas/tcg.schema';
import { StockRowEntity } from '../entities/stock-row.entity';

export const ListStockQuery = ListParams.extend({
  tcg: Tcg.optional(),
});

export type TListStockQuery = z.infer<typeof ListStockQuery>;

export const ListStockResponse = z.object({
  items: z.array(StockRowEntity),
  pagination: Pagination,
});

export type TListStockResponse = z.infer<typeof ListStockResponse>;

export const ListStockSchema = {
  querystring: ListStockQuery,
  response: {
    200: ListStockResponse,
    401: ErrorResponse,
  },
  description:
    'Lista cartas com saldo em estoque, demanda em pedidos abertos (exceto orçamento e entregue) e demanda apenas em orçamentos.',
  tags: ['Stock'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ListParams } from '../../../common/schemas/list-params.schema';
import { Pagination } from '../../../common/schemas/pagination.schema';
import { BrazilUf } from '../../../common/schemas/brazil-uf.schema';
import { OrderPipelineStatus } from '../../../common/schemas/order.schema';
import { OrderSummaryEntity } from '../entities/order.entity';

export const ListOrdersQuery = ListParams.extend({
  order_status: OrderPipelineStatus.optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  customer_state: BrazilUf.optional(),
});

export type TListOrdersQuery = z.infer<typeof ListOrdersQuery>;

export const ListOrdersResponse = z.object({
  items: z.array(OrderSummaryEntity),
  pagination: Pagination,
});

export type TListOrdersResponse = z.infer<typeof ListOrdersResponse>;

export const ListOrdersSchema = {
  querystring: ListOrdersQuery,
  response: {
    200: ListOrdersResponse,
    401: ErrorResponse,
  },
  description: 'Lista pedidos com filtros opcionais.',
  tags: ['Order'],
};

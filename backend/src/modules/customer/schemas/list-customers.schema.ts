import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ListParams } from '../../../common/schemas/list-params.schema';
import { Pagination } from '../../../common/schemas/pagination.schema';
import { CustomerEntity } from '../entities/customer.entity';

export const ListCustomersQuery = ListParams;
export type TListCustomersQuery = z.infer<typeof ListCustomersQuery>;

export const ListCustomersResponse = z.object({
  items: z.array(CustomerEntity),
  pagination: Pagination,
});

export type TListCustomersResponse = z.infer<typeof ListCustomersResponse>;

export const ListCustomersSchema = {
  querystring: ListCustomersQuery,
  response: {
    200: ListCustomersResponse,
    401: ErrorResponse,
  },
  description: 'Lista clientes (paginação + busca opcional).',
  tags: ['Customer'],
};

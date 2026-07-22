import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { ListParams } from '../../../common/schemas/list-params.schema';
import { Pagination } from '../../../common/schemas/pagination.schema';
import { OrderPipelineStatus } from '../../../common/schemas/order.schema';
import { Tcg } from '../../../common/schemas/tcg.schema';
import {
  OrderCardSnapshot,
  OrderPrintModelSnapshot,
} from '../../order/entities/order.entity';

export const GetCustomerPurchaseInfoParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TGetCustomerPurchaseInfoParams = z.infer<typeof GetCustomerPurchaseInfoParams>;

export const GetCustomerPurchaseInfoQuery = ListParams;
export type TGetCustomerPurchaseInfoQuery = z.infer<typeof GetCustomerPurchaseInfoQuery>;

export const CustomerPurchaseInfoCustomer = z.object({
  id: z.number(),
  name: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
});

export const CustomerPurchaseInfoStats = z.object({
  order_count: z.number(),
  total_units: z.number(),
  total_order_value: z.number(),
  total_paid: z.number(),
});

export const CustomerPurchaseInfoUnitsByTcg = z.object({
  tcg: Tcg,
  total_units: z.number(),
});

export const CustomerPurchaseInfoRecentLine = z.object({
  order_id: z.number(),
  order_date: z.date(),
  order_status: OrderPipelineStatus,
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot.nullable(),
});

export const GetCustomerPurchaseInfoResponse = z.object({
  customer: CustomerPurchaseInfoCustomer,
  stats: CustomerPurchaseInfoStats,
  units_by_tcg: z.array(CustomerPurchaseInfoUnitsByTcg),
  recent_lines: z.object({
    items: z.array(CustomerPurchaseInfoRecentLine),
    pagination: Pagination,
  }),
});

export type TGetCustomerPurchaseInfoResponse = z.infer<typeof GetCustomerPurchaseInfoResponse>;

export const GetCustomerPurchaseInfoSchema = {
  params: GetCustomerPurchaseInfoParams,
  querystring: GetCustomerPurchaseInfoQuery,
  response: {
    200: GetCustomerPurchaseInfoResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Resumo de compras e histórico paginado de um cliente.',
  tags: ['Customer'],
};

import { z } from 'zod';

import { BrazilUf } from '../../../common/schemas/brazil-uf.schema';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { Tcg } from '../../../common/schemas/tcg.schema';

export const InsightsTopCustomerByRevenue = z.object({
  customer_id: z.number(),
  name: z.string(),
  total_revenue: z.number(),
});

export const InsightsTopCardByQuantity = z.object({
  card_id: z.number(),
  tcg: z.string(),
  card_type: z.string(),
  name: z.string().nullable(),
  edition: z.string().nullable(),
  total_quantity: z.number(),
});

export const InsightsTopCustomerByUnits = z.object({
  customer_id: z.number(),
  name: z.string(),
  total_units: z.number(),
});

export const OrderStatsInsights = z.object({
  top_customer_by_revenue: InsightsTopCustomerByRevenue.nullable(),
  top_card_by_quantity: InsightsTopCardByQuantity.nullable(),
  top_customer_by_units: InsightsTopCustomerByUnits.nullable(),
});

export const RevenueByMonthPoint = z.object({
  month: z.string(),
  revenue: z.number(),
});

export const InProgressByStatus = z.object({
  partial_payment: z.number(),
  paid: z.number(),
  awaiting_payment: z.number(),
});

export const OpenShipmentSummary = z.object({
  id: z.number(),
  display_number: z.number(),
  line_count: z.number(),
  total_units: z.number(),
});

export const OperationsSummary = z.object({
  graphic_total_units: z.number(),
  print_backlog_order_count: z.number(),
  pending_production_lines: z.number(),
  missing_print_model_lines: z.number(),
  open_shipment: OpenShipmentSummary.nullable(),
});

export const OrderStatsResponse = z.object({
  quotes_count: z.number(),
  in_progress_count: z.number(),
  in_progress_by_status: InProgressByStatus,
  ready_for_delivery_count: z.number(),
  delivered_count: z.number(),
  revenue_month: z.number(),
  pipeline_value: z.number(),
  amount_due_total: z.number(),
  orders_with_balance_count: z.number(),
  items_by_art_status: z.object({
    art_to_do: z.number(),
    art_ready: z.number(),
    confirmed: z.number(),
    printing: z.number(),
    printed: z.number(),
  }),
  active_cards_count: z.number(),
  insights: OrderStatsInsights,
  revenue_by_month: z.array(RevenueByMonthPoint),
  confirmed_revenue_by_month: z.array(RevenueByMonthPoint),
  operations: OperationsSummary,
});

export type TOrderStatsResponse = z.infer<typeof OrderStatsResponse>;

export const GetOrderStatsQuery = z.object({
  period_months: z.coerce
    .number()
    .pipe(z.union([z.literal(3), z.literal(6), z.literal(12)]))
    .optional()
    .default(12),
  tcg: Tcg.optional(),
  customer_state: BrazilUf.optional(),
});

export type TGetOrderStatsQuery = z.infer<typeof GetOrderStatsQuery>;

export const GetOrderStatsSchema = {
  querystring: GetOrderStatsQuery,
  response: {
    200: OrderStatsResponse,
    401: ErrorResponse,
  },
  description: 'Estatísticas agregadas de pedidos para o dashboard.',
  tags: ['Order'],
};

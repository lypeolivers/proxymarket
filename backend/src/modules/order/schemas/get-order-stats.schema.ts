import { z } from 'zod';

import { ErrorResponse } from '../../../common/schemas/error-response.schema';



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



export const OrderStatsResponse = z.object({

  quotes_count: z.number(),

  in_progress_count: z.number(),

  ready_for_delivery_count: z.number(),

  delivered_count: z.number(),

  revenue_month: z.number(),

  pipeline_value: z.number(),

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

});



export type TOrderStatsResponse = z.infer<typeof OrderStatsResponse>;



export const GetOrderStatsSchema = {

  response: {

    200: OrderStatsResponse,

    401: ErrorResponse,

  },

  description: 'Estatísticas agregadas de pedidos para o dashboard.',

  tags: ['Order'],

};



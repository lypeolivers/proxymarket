import api from '@/lib/api'
import {
  GetOrderStatsParams,
  OrderStats,
  type TGetOrderStatsParams,
  type TOrderStats,
} from '@/modules/order/types/order.model'

/** GET `/order/stats` — estatísticas agregadas para o dashboard. */
export async function getOrderStatsService(
  params?: TGetOrderStatsParams,
): Promise<TOrderStats> {
  const query = params ? GetOrderStatsParams.parse(params) : undefined
  const response = await api.get<unknown>('order/stats', { params: query })
  return OrderStats.parse(response.data)
}

import api from '@/lib/api'
import { OrderStats, type TOrderStats } from '@/modules/order/types/order.model'

/** GET `/order/stats` — estatísticas agregadas para o dashboard. */
export async function getOrderStatsService(): Promise<TOrderStats> {
  const response = await api.get<unknown>('order/stats')
  return OrderStats.parse(response.data)
}

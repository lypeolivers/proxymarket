import api from '@/lib/api'
import { Order, type TOrder } from '@/modules/order/types/order.model'

/** POST `/order/:id/send-to-production` — envia linhas pendentes para a remessa aberta. */
export async function sendOrderToProductionService(orderId: number): Promise<TOrder> {
  const response = await api.post<unknown>(`order/${orderId}/send-to-production`)
  return Order.parse(response.data)
}

import api from '@/lib/api'
import { Order, type TOrder } from '@/modules/order/types/order.model'

/** GET `/order/:id`. */
export async function getOrderService(id: number): Promise<TOrder> {
  const response = await api.get<unknown>(`order/${id}`)
  return Order.parse(response.data)
}

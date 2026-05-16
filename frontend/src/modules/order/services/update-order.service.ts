import api from '@/lib/api'
import {
  Order,
  OrderBody,
  type TOrder,
  type TOrderBody,
} from '@/modules/order/types/order.model'

/** PUT `/order/:id` — substitui o pedido e os itens. */
export async function updateOrderService(id: number, body: TOrderBody): Promise<TOrder> {
  const payload = OrderBody.parse(body)
  const response = await api.put<unknown>(`order/${id}`, payload)
  return Order.parse(response.data)
}

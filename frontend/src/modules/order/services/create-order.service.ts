import api from '@/lib/api'
import {
  Order,
  OrderBody,
  type TOrder,
  type TOrderBody,
} from '@/modules/order/types/order.model'

/** POST `/order` — cria um pedido. */
export async function createOrderService(body: TOrderBody): Promise<TOrder> {
  const payload = OrderBody.parse(body)
  const response = await api.post<unknown>('order', payload)
  return Order.parse(response.data)
}

import api from '@/lib/api'
import {
  Order,
  PatchOrderBody,
  type TOrder,
  type TPatchOrderBody,
} from '@/modules/order/types/order.model'

/** PATCH `/order/:id` — atualiza o cabeçalho do pedido. */
export async function patchOrderService(id: number, body: TPatchOrderBody): Promise<TOrder> {
  const payload = PatchOrderBody.parse(body)
  const response = await api.patch<unknown>(`order/${id}`, payload)
  return Order.parse(response.data)
}

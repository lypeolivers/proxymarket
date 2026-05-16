import api from '@/lib/api'
import {
  Order,
  PatchOrderItemBody,
  type TOrder,
  type TPatchOrderItemBody,
} from '@/modules/order/types/order.model'

/** PATCH `/order/:id/items/:itemId` — atualiza um item do pedido. */
export async function patchOrderItemService(
  orderId: number,
  itemId: number,
  body: TPatchOrderItemBody,
): Promise<TOrder> {
  const payload = PatchOrderItemBody.parse(body)
  const response = await api.patch<unknown>(`order/${orderId}/items/${itemId}`, payload)
  return Order.parse(response.data)
}

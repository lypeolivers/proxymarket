import api from '@/lib/api'

export type RemoveProductionOrderItemResult = {
  ok: true
}

/** PATCH `/production/shipment/:shipmentId/order-item/:itemId/remove-from-production` */
export async function removeProductionOrderItemService(
  shipmentId: number,
  itemId: number,
): Promise<RemoveProductionOrderItemResult> {
  const response = await api.patch<unknown>(
    `production/shipment/${shipmentId}/order-item/${itemId}/remove-from-production`,
  )
  return response.data as RemoveProductionOrderItemResult
}

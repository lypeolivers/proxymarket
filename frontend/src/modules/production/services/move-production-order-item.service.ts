import api from '@/lib/api'
import { z } from 'zod'

const Response = z.object({
  ok: z.literal(true),
})

/** PATCH `/production/shipment/:targetShipmentId/order-item/:itemId/move` */
export async function moveProductionOrderItemService(
  targetShipmentId: number,
  itemId: number,
): Promise<void> {
  const response = await api.patch<unknown>(
    `production/shipment/${targetShipmentId}/order-item/${itemId}/move`,
  )
  Response.parse(response.data)
}

import api from '@/lib/api'
import { z } from 'zod'

const Body = z.object({
  art_status: z.enum(['art_to_do', 'art_ready']),
})

export type PatchProductionOrderItemArtBody = z.infer<typeof Body>

const Response = z.object({
  ok: z.literal(true),
  art_status: z.enum(['art_to_do', 'art_ready']),
})

export type PatchProductionOrderItemArtResult = z.infer<typeof Response>

/** PATCH `/production/shipment/:id/order-item/:itemId/art-status` */
export async function patchProductionOrderItemArtService(
  shipmentId: number,
  itemId: number,
  body: PatchProductionOrderItemArtBody,
): Promise<PatchProductionOrderItemArtResult> {
  const payload = Body.parse(body)
  const response = await api.patch<unknown>(
    `production/shipment/${shipmentId}/order-item/${itemId}/art-status`,
    payload,
  )
  return Response.parse(response.data)
}

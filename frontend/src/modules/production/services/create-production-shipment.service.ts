import api from '@/lib/api'
import { z } from 'zod'

import {
  ProductionShipmentStatus,
  type TProductionShipmentStatus,
} from '@/modules/production/types/production.model'

const Body = z.object({
  status: ProductionShipmentStatus.optional(),
})

const Response = z.object({
  id: z.number(),
  display_number: z.number(),
  status: ProductionShipmentStatus,
})

export type CreateProductionShipmentResponse = z.infer<typeof Response>

/** POST `/production/shipment` */
export async function createProductionShipmentService(body?: {
  status?: TProductionShipmentStatus
}): Promise<CreateProductionShipmentResponse> {
  const payload = Body.parse(body ?? {})
  const response = await api.post<unknown>('production/shipment', payload)
  return Response.parse(response.data)
}

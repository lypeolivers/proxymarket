import api from '@/lib/api'
import {
  ProductionShipmentStatus,
  type TProductionShipmentStatus,
} from '@/modules/production/types/production.model'
import { z } from 'zod'

const PatchShipmentBody = z.object({
  status: ProductionShipmentStatus,
})

export type PatchProductionShipmentBody = z.infer<typeof PatchShipmentBody>

const PatchShipmentResponse = z.object({
  id: z.number(),
  display_number: z.number(),
  status: ProductionShipmentStatus,
})

/** PATCH `/production/shipment/:id` */
export async function patchProductionShipmentService(
  id: number,
  body: PatchProductionShipmentBody,
): Promise<{ id: number; display_number: number; status: TProductionShipmentStatus }> {
  const payload = PatchShipmentBody.parse(body)
  const response = await api.patch<unknown>(`production/shipment/${id}`, payload)
  return PatchShipmentResponse.parse(response.data)
}

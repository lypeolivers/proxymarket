import api from '@/lib/api'
import {
  ListProductionShipmentsResponse,
  type TListProductionShipmentsResponse,
} from '@/modules/production/types/production.model'

/** GET `/production/shipment` */
export async function listProductionShipmentsService(): Promise<TListProductionShipmentsResponse> {
  const response = await api.get<unknown>('production/shipment')
  return ListProductionShipmentsResponse.parse(response.data)
}

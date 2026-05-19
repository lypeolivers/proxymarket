import api from '@/lib/api'
import {
  GraphicSummaryResponse,
  type TGraphicSummaryResponse,
} from '@/modules/stock/types/graphic-summary.model'

/** GET `/production/shipment/:id/graphic-summary` */
export async function getProductionGraphicSummaryService(
  shipmentId: number,
): Promise<TGraphicSummaryResponse> {
  const response = await api.get<unknown>(`production/shipment/${shipmentId}/graphic-summary`)
  return GraphicSummaryResponse.parse(response.data)
}

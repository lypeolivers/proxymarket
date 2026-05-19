import api from '@/lib/api'
import {
  GraphicSummaryResponse,
  type TGraphicSummaryResponse,
} from '@/modules/stock/types/graphic-summary.model'

/** GET `/stock/graphic-summary` — texto para enviar à gráfica. */
export async function getGraphicSummaryService(): Promise<TGraphicSummaryResponse> {
  const response = await api.get<unknown>('stock/graphic-summary')
  return GraphicSummaryResponse.parse(response.data)
}

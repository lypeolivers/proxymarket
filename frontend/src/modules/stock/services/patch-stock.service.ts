import api from '@/lib/api'
import {
  PatchStockResponse,
  type TPatchStockResponse,
} from '@/modules/stock/types/stock.model'

/** PATCH `/stock/:cardId` — define quantidade em estoque (unidades prontas). */
export async function patchStockService(
  cardId: number,
  quantity: number,
): Promise<TPatchStockResponse> {
  const response = await api.patch<unknown>(`stock/${cardId}`, { quantity })
  return PatchStockResponse.parse(response.data)
}

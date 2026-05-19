import api from '@/lib/api'
import type { TTcg } from '@/modules/card/types/card.model'
import {
  ListStockResponse,
  type TListStockResponse,
} from '@/modules/stock/types/stock.model'

export type ListStockParams = {
  tcg?: TTcg
  offset?: number
  limit?: number
  q?: string
  sort_by?: string
  sort?: 'asc' | 'desc'
}

/** GET `/stock` — cartas com saldo e demanda agregada. */
export async function listStockService(
  params: ListStockParams = {},
): Promise<TListStockResponse> {
  const response = await api.get<unknown>('stock', { params })
  return ListStockResponse.parse(response.data)
}

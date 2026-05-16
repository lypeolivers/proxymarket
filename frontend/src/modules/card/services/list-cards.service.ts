import api from '@/lib/api'
import {
  ListCardsResponse,
  type TListCardsResponse,
  type TTcg,
} from '@/modules/card/types/card.model'

export type ListCardsParams = {
  tcg?: TTcg
  offset?: number
  limit?: number
  q?: string
  sort_by?: string
  sort?: 'asc' | 'desc'
}

/** GET `/card` — lista paginada com filtro opcional por TCG. */
export async function listCardsService(
  params: ListCardsParams = {},
): Promise<TListCardsResponse> {
  const response = await api.get<unknown>('card', { params })
  return ListCardsResponse.parse(response.data)
}

import api from '@/lib/api'
import type { TTcg } from '@/modules/card/types/card.model'
import {
  ListCardPrintModelsResponse,
  type TListCardPrintModelsResponse,
} from '@/modules/card-print-model/types/card-print-model.model'

export type ListCardPrintModelsParams = {
  card_id?: number
  tcg?: TTcg
  offset?: number
  limit?: number
  q?: string
  sort_by?: string
  sort?: 'asc' | 'desc'
}

/** GET `/card-print-model` */
export async function listCardPrintModelsService(
  params: ListCardPrintModelsParams = {},
): Promise<TListCardPrintModelsResponse> {
  const response = await api.get<unknown>('card-print-model', { params })
  return ListCardPrintModelsResponse.parse(response.data)
}

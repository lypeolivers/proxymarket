import api from '@/lib/api'
import {
  DeleteCardResponse,
  type TDeleteCardResponse,
} from '@/modules/card/types/card.model'

/** DELETE `/card/:id` — soft delete. */
export async function deleteCardService(
  id: number,
): Promise<TDeleteCardResponse> {
  const response = await api.delete<unknown>(`card/${id}`)
  return DeleteCardResponse.parse(response.data)
}

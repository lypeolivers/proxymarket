import api from '@/lib/api'
import { Card, type TCard } from '@/modules/card/types/card.model'

/** GET `/card/:id`. */
export async function getCardService(id: number): Promise<TCard> {
  const response = await api.get<unknown>(`card/${id}`)
  return Card.parse(response.data)
}

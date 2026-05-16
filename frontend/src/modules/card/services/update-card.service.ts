import api from '@/lib/api'
import {
  Card,
  CardBody,
  type TCard,
  type TCardBody,
} from '@/modules/card/types/card.model'

/** PUT `/card/:id` — substitui os dados de uma carta. */
export async function updateCardService(
  id: number,
  body: TCardBody,
): Promise<TCard> {
  const payload = CardBody.parse(body)
  const response = await api.put<unknown>(`card/${id}`, payload)
  return Card.parse(response.data)
}

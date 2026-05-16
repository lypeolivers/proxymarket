import api from '@/lib/api'
import {
  Card,
  CardBody,
  type TCard,
  type TCardBody,
} from '@/modules/card/types/card.model'

/** POST `/card` — cria uma nova carta no catálogo. */
export async function createCardService(body: TCardBody): Promise<TCard> {
  const payload = CardBody.parse(body)
  const response = await api.post<unknown>('card', payload)
  return Card.parse(response.data)
}

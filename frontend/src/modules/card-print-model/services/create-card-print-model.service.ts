import api from '@/lib/api'
import {
  CardPrintModelBody,
  CardPrintModelRecord,
  type TCardPrintModelBody,
  type TCardPrintModelRecord,
} from '@/modules/card-print-model/types/card-print-model.model'

export async function createCardPrintModelService(
  body: TCardPrintModelBody,
): Promise<TCardPrintModelRecord> {
  const payload = CardPrintModelBody.parse(body)
  const response = await api.post<unknown>('card-print-model', payload)
  return CardPrintModelRecord.parse(response.data)
}

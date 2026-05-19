import api from '@/lib/api'
import { CardPrintModelRecord, type TCardPrintModelRecord } from '@/modules/card-print-model/types/card-print-model.model'
import { z } from 'zod'

const PatchBody = z
  .object({
    name: z.string().trim().min(1).optional(),
    file_name: z.string().trim().min(1).optional(),
  })
  .refine((d) => d.name !== undefined || d.file_name !== undefined, {
    message: 'Informe ao menos um campo.',
  })

export type PatchCardPrintModelBody = z.infer<typeof PatchBody>

export async function patchCardPrintModelService(
  id: number,
  body: PatchCardPrintModelBody,
): Promise<TCardPrintModelRecord> {
  const payload = PatchBody.parse(body)
  const response = await api.patch<unknown>(`card-print-model/${id}`, payload)
  return CardPrintModelRecord.parse(response.data)
}

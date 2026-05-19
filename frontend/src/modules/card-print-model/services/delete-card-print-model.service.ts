import api from '@/lib/api'

/** DELETE `/card-print-model/:id` (soft delete). */
export async function deleteCardPrintModelService(id: number): Promise<void> {
  await api.delete(`card-print-model/${id}`)
}

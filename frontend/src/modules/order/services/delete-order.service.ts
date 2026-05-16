import api from '@/lib/api'
import { z } from 'zod'

/** DELETE `/order/:id` — remove um pedido (soft delete). */
export async function deleteOrderService(id: number): Promise<{ id: number }> {
  const response = await api.delete<unknown>(`order/${id}`)
  return z.object({ id: z.number() }).parse(response.data)
}

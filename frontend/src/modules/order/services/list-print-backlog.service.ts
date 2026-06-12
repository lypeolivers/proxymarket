import api from '@/lib/api'
import { PrintBacklogResponse, type TPrintBacklogResponse } from '@/modules/order/types/order.model'

export async function listPrintBacklogService(params?: {
  limit?: number
}): Promise<TPrintBacklogResponse> {
  const response = await api.get<unknown>('order/print-backlog', { params })
  return PrintBacklogResponse.parse(response.data)
}

import api from '@/lib/api'
import { BrazilUfZod } from '@/modules/customer/types/customer.model'
import type { z } from 'zod'
import {
  ListOrdersResponse,
  type TListOrdersResponse,
  type TOrderPipelineStatus,
} from '@/modules/order/types/order.model'

export type ListOrdersParams = {
  order_status?: TOrderPipelineStatus
  exclude_order_status?: TOrderPipelineStatus
  customer_state?: z.infer<typeof BrazilUfZod>
  customer_id?: number
  q?: string
  offset?: number
  limit?: number
  sort_by?: string
  sort?: 'asc' | 'desc'
}

/** GET `/order` — lista pedidos com filtros opcionais. */
export async function listOrdersService(
  params: ListOrdersParams = {},
): Promise<TListOrdersResponse> {
  const response = await api.get<unknown>('order', { params })
  return ListOrdersResponse.parse(response.data)
}

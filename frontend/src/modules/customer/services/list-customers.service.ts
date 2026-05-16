import api from '@/lib/api'
import {
  ListCustomersResponse,
  type TListCustomersResponse,
} from '@/modules/customer/types/customer.model'

export type ListCustomersParams = {
  offset?: number
  limit?: number
  q?: string
  sort_by?: string
  sort?: 'asc' | 'desc'
}

/** GET `/customer` — lista paginada de clientes. */
export async function listCustomersService(
  params: ListCustomersParams = {},
): Promise<TListCustomersResponse> {
  const response = await api.get<unknown>('customer', { params })
  return ListCustomersResponse.parse(response.data)
}

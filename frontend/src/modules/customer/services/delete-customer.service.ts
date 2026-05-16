import api from '@/lib/api'
import {
  DeleteCustomerResponse,
  type TDeleteCustomerResponse,
} from '@/modules/customer/types/customer.model'

/** DELETE `/customer/:id` — remove um cliente (soft delete). */
export async function deleteCustomerService(id: number): Promise<TDeleteCustomerResponse> {
  const response = await api.delete<unknown>(`customer/${id}`)
  return DeleteCustomerResponse.parse(response.data)
}

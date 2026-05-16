import api from '@/lib/api'
import {
  Customer,
  CustomerBody,
  type TCustomer,
  type TCustomerBody,
} from '@/modules/customer/types/customer.model'

/** PUT `/customer/:id` — atualiza um cliente. */
export async function updateCustomerService(
  id: number,
  body: TCustomerBody,
): Promise<TCustomer> {
  const payload = CustomerBody.parse(body)
  const response = await api.put<unknown>(`customer/${id}`, payload)
  return Customer.parse(response.data)
}

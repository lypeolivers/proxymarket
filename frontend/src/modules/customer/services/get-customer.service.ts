import api from '@/lib/api'
import { Customer, type TCustomer } from '@/modules/customer/types/customer.model'

/** GET `/customer/:id`. */
export async function getCustomerService(id: number): Promise<TCustomer> {
  const response = await api.get<unknown>(`customer/${id}`)
  return Customer.parse(response.data)
}

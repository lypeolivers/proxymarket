import api from '@/lib/api'
import {
  Customer,
  CustomerBody,
  type TCustomer,
  type TCustomerBody,
} from '@/modules/customer/types/customer.model'

/** POST `/customer` — cria um cliente. */
export async function createCustomerService(body: TCustomerBody): Promise<TCustomer> {
  const payload = CustomerBody.parse(body)
  const response = await api.post<unknown>('customer', payload)
  return Customer.parse(response.data)
}

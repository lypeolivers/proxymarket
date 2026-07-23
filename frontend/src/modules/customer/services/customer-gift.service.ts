import api from '@/lib/api'
import {
  CreateCustomerGiftBody,
  CustomerGift,
  ListCustomerGiftsResponse,
  type TCreateCustomerGiftBody,
  type TCustomerGift,
  type TListCustomerGiftsResponse,
} from '@/modules/customer/types/customer.model'

/** GET `/customer/:id/gift` — lista brindes do cliente. */
export async function listCustomerGiftsService(
  customerId: number,
): Promise<TListCustomerGiftsResponse> {
  const response = await api.get<unknown>(`customer/${customerId}/gift`)
  return ListCustomerGiftsResponse.parse(response.data)
}

/** POST `/customer/:id/gift` — concede brinde ao cliente. */
export async function createCustomerGiftService(
  customerId: number,
  body: TCreateCustomerGiftBody,
): Promise<TCustomerGift> {
  const payload = CreateCustomerGiftBody.parse(body)
  const response = await api.post<unknown>(`customer/${customerId}/gift`, payload)
  return CustomerGift.parse(response.data)
}

/** DELETE `/customer/:id/gift/:giftId` — remove brinde não utilizado. */
export async function deleteCustomerGiftService(
  customerId: number,
  giftId: number,
): Promise<void> {
  await api.delete(`customer/${customerId}/gift/${giftId}`)
}

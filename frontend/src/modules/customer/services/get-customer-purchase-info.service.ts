import api from '@/lib/api'
import {
  CustomerPurchaseInfoResponse,
  type TCustomerPurchaseInfoResponse,
} from '@/modules/customer/types/customer.model'

export type GetCustomerPurchaseInfoParams = {
  offset?: number
  limit?: number
}

/** GET `/customer/:id/purchase-info` — resumo de compras e histórico paginado. */
export async function getCustomerPurchaseInfoService(
  customerId: number,
  params: GetCustomerPurchaseInfoParams = {},
): Promise<TCustomerPurchaseInfoResponse> {
  const response = await api.get<unknown>(`customer/${customerId}/purchase-info`, { params })
  return CustomerPurchaseInfoResponse.parse(response.data)
}

import api from '@/lib/api'
import { OrderPayment, type TOrderPayment } from '@/modules/order/types/order.model'

export type CreateOrderPaymentBody = {
  amount: number
  collected_at: string
  notes?: string | null
}

export async function createOrderPaymentService(
  orderId: number,
  body: CreateOrderPaymentBody,
): Promise<TOrderPayment> {
  const response = await api.post<unknown>(`order/${orderId}/payment`, body)
  return OrderPayment.parse(response.data)
}

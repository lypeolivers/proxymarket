import api from '@/lib/api'

export async function deleteOrderPaymentService(
  orderId: number,
  paymentId: number,
): Promise<void> {
  await api.delete(`order/${orderId}/payment/${paymentId}`)
}

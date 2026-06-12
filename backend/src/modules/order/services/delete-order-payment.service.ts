import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  DeleteOrderPaymentResponse,
  type TDeleteOrderPaymentResponse,
} from '../schemas/delete-order-payment.schema';

export class DeleteOrderPaymentService {
  async execute(orderId: number, paymentId: number): Promise<TDeleteOrderPaymentResponse> {
    const payment = await prisma.orderPayment.findFirst({
      where: {
        id: paymentId,
        order_id: orderId,
        is_deleted: false,
      },
    });

    if (!payment) {
      throw ApiError('not-found', 'Pagamento não encontrado', undefined, 404);
    }

    await prisma.orderPayment.update({
      where: { id: paymentId },
      data: { is_deleted: true },
    });

    return DeleteOrderPaymentResponse.parse({ success: true });
  }
}

export const deleteOrderPaymentService = new DeleteOrderPaymentService();

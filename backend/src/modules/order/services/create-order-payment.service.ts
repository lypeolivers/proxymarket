import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import { OrderPaymentEntity, type TOrderPaymentEntity } from '../entities/order-payment.entity';
import type { TCreateOrderPaymentBody } from '../schemas/create-order-payment.schema';
import { loadOrderEntity } from './order-mapper';
import {
  computePaymentSummary,
  roundMoney,
  sumOrderPayments,
} from './order-payment-helpers';
import { toUnitPrice } from './order-helpers';

export class CreateOrderPaymentService {
  async execute(orderId: number, data: TCreateOrderPaymentBody): Promise<TOrderPaymentEntity> {
    return runInTransaction(async (transaction) => {
      const order = await loadOrderEntity(orderId, transaction);
      if (!order) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      const currentPaid = await sumOrderPayments(orderId, transaction);
      const nextPaid = roundMoney(currentPaid + data.amount);

      if (nextPaid > roundMoney(order.total_amount)) {
        throw ApiError(
          'payment-exceeds-total',
          'O valor recebido ultrapassa o total do pedido.',
          undefined,
          400
        );
      }

      const created = await transaction.orderPayment.create({
        data: {
          order_id: orderId,
          amount: data.amount,
          collected_at: data.collected_at,
          notes: data.notes?.trim() || null,
        },
      });

      return OrderPaymentEntity.parse({
        id: created.id,
        amount: toUnitPrice(created.amount),
        collected_at: created.collected_at,
        notes: created.notes,
        created_at: created.created_at,
      });
    });
  }
}

export const createOrderPaymentService = new CreateOrderPaymentService();

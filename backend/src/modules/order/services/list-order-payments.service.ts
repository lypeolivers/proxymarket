import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import { OrderPaymentEntity, type TOrderPaymentEntity } from '../entities/order-payment.entity';
import {
  ListOrderPaymentsResponse,
  type TListOrderPaymentsResponse,
} from '../schemas/list-order-payments.schema';
import { toUnitPrice } from './order-helpers';

function mapPayment(row: {
  id: number;
  amount: unknown;
  collected_at: Date;
  notes: string | null;
  created_at: Date;
}): TOrderPaymentEntity {
  return OrderPaymentEntity.parse({
    id: row.id,
    amount: toUnitPrice(row.amount),
    collected_at: row.collected_at,
    notes: row.notes,
    created_at: row.created_at,
  });
}

export class ListOrderPaymentsService {
  async execute(orderId: number): Promise<TListOrderPaymentsResponse> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, is_deleted: false },
      select: { id: true },
    });

    if (!order) {
      throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
    }

    const rows = await prisma.orderPayment.findMany({
      where: { order_id: orderId, is_deleted: false },
      orderBy: [{ collected_at: 'desc' }, { id: 'desc' }],
    });

    return ListOrderPaymentsResponse.parse({
      items: rows.map(mapPayment),
    });
  }
}

export const listOrderPaymentsService = new ListOrderPaymentsService();

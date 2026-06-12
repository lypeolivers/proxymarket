import { ApiError } from '../../../common/errors/api-error';
import { isOrderProductionEligible } from '../../../common/schemas/order.schema';
import { runInTransaction } from '../../../infra/database/prisma';
import { getOrCreateOpenProductionShipment } from '../../production/services/get-or-create-open-production-shipment.service';
import {
  SendOrderToProductionResponse,
  type TSendOrderToProductionResponse,
} from '../schemas/send-order-to-production.schema';
import { loadOrderEntity } from './order-mapper';

export class SendOrderToProductionService {
  async execute(orderId: number): Promise<TSendOrderToProductionResponse> {
    const result = await runInTransaction(async (transaction) => {
      const order = await transaction.order.findFirst({
        where: { id: orderId, is_deleted: false },
      });

      if (!order) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      if (!isOrderProductionEligible(order.order_status)) {
        throw ApiError(
          'production-not-applicable',
          'Pedidos em aguardando pagamento, prontos para entrega ou entregues não são enviados à produção.',
          undefined,
          400
        );
      }

      const pending = await transaction.orderItem.findMany({
        where: {
          order_id: orderId,
          is_deleted: false,
          production_shipment_id: null,
          fulfill_from_stock: false,
        },
        select: { id: true, card_print_model_id: true },
      });

      if (pending.length === 0) {
        throw ApiError(
          'no-pending-production',
          'Não há linhas pendentes de envio para a produção.',
          undefined,
          400
        );
      }

      const missingModel = pending.filter((row) => row.card_print_model_id == null);
      if (missingModel.length > 0) {
        throw ApiError(
          'missing-print-model',
          `${missingModel.length} linha(s) sem modelo de impressão. Defina o modelo antes de enviar à produção.`,
          undefined,
          400
        );
      }

      const shipmentId = await getOrCreateOpenProductionShipment(transaction);

      await transaction.orderItem.updateMany({
        where: {
          id: { in: pending.map((row) => row.id) },
        },
        data: { production_shipment_id: shipmentId },
      });

      const loaded = await loadOrderEntity(orderId, transaction);
      if (!loaded) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      return loaded;
    });

    return SendOrderToProductionResponse.parse(result);
  }
}

export const sendOrderToProductionService = new SendOrderToProductionService();

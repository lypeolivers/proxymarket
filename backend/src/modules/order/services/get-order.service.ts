import { ApiError } from '../../../common/errors/api-error';
import { GetOrderResponse, TGetOrderResponse } from '../schemas/get-order.schema';
import { loadOrderEntity } from './order-mapper';

export class GetOrderService {
  async execute(id: number): Promise<TGetOrderResponse> {
    const order = await loadOrderEntity(id);

    if (!order) {
      throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
    }

    return GetOrderResponse.parse(order);
  }
}

export const getOrderService = new GetOrderService();

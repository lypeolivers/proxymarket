import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleCreateOrder from '../controllers/create-order.controller';
import handleDeleteOrder from '../controllers/delete-order.controller';
import handleGetOrder from '../controllers/get-order.controller';
import handleGetOrderStats from '../controllers/get-order-stats.controller';
import handleListOrders from '../controllers/list-orders.controller';
import handlePatchOrder from '../controllers/patch-order.controller';
import handlePatchOrderItem from '../controllers/patch-order-item.controller';
import handleUpdateOrder from '../controllers/update-order.controller';
import { CreateOrderSchema } from '../schemas/create-order.schema';
import { DeleteOrderSchema } from '../schemas/delete-order.schema';
import { GetOrderSchema } from '../schemas/get-order.schema';
import { GetOrderStatsSchema } from '../schemas/get-order-stats.schema';
import { ListOrdersSchema } from '../schemas/list-orders.schema';
import { PatchOrderSchema } from '../schemas/patch-order.schema';
import { PatchOrderItemSchema } from '../schemas/patch-order-item.schema';
import { UpdateOrderSchema } from '../schemas/update-order.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/order`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}/stats`, { schema: GetOrderStatsSchema, onRequest }, handleGetOrderStats);
  http.get(`${prefix}`, { schema: ListOrdersSchema, onRequest }, handleListOrders);
  http.get(`${prefix}/:id`, { schema: GetOrderSchema, onRequest }, handleGetOrder);
  http.post(`${prefix}`, { schema: CreateOrderSchema, onRequest }, handleCreateOrder);
  http.put(`${prefix}/:id`, { schema: UpdateOrderSchema, onRequest }, handleUpdateOrder);
  http.patch(`${prefix}/:id`, { schema: PatchOrderSchema, onRequest }, handlePatchOrder);
  http.patch(
    `${prefix}/:id/items/:itemId`,
    { schema: PatchOrderItemSchema, onRequest },
    handlePatchOrderItem
  );
  http.delete(`${prefix}/:id`, { schema: DeleteOrderSchema, onRequest }, handleDeleteOrder);
}

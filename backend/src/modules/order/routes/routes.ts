import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleCreateOrder from '../controllers/create-order.controller';
import handleCreateOrderPayment from '../controllers/create-order-payment.controller';
import handleDeleteOrderPayment from '../controllers/delete-order-payment.controller';
import handleListOrderPayments from '../controllers/list-order-payments.controller';
import handleDeleteOrder from '../controllers/delete-order.controller';
import handleGetOrder from '../controllers/get-order.controller';
import handleGetOrderStats from '../controllers/get-order-stats.controller';
import handleListOrders from '../controllers/list-orders.controller';
import handleListPrintBacklog from '../controllers/list-print-backlog.controller';
import handlePatchOrder from '../controllers/patch-order.controller';
import handlePatchOrderItem from '../controllers/patch-order-item.controller';
import handleSendOrderToProduction from '../controllers/send-order-to-production.controller';
import handleUpdateOrder from '../controllers/update-order.controller';
import { CreateOrderPaymentSchema } from '../schemas/create-order-payment.schema';
import { CreateOrderSchema } from '../schemas/create-order.schema';
import { DeleteOrderPaymentSchema } from '../schemas/delete-order-payment.schema';
import { ListOrderPaymentsSchema } from '../schemas/list-order-payments.schema';
import { DeleteOrderSchema } from '../schemas/delete-order.schema';
import { GetOrderSchema } from '../schemas/get-order.schema';
import { GetOrderStatsSchema } from '../schemas/get-order-stats.schema';
import { ListOrdersSchema } from '../schemas/list-orders.schema';
import { PrintBacklogSchema } from '../schemas/print-backlog.schema';
import { PatchOrderSchema } from '../schemas/patch-order.schema';
import { PatchOrderItemSchema } from '../schemas/patch-order-item.schema';
import { SendOrderToProductionSchema } from '../schemas/send-order-to-production.schema';
import { UpdateOrderSchema } from '../schemas/update-order.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/order`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}/stats`, { schema: GetOrderStatsSchema, onRequest }, handleGetOrderStats);
  http.get(
    `${prefix}/print-backlog`,
    { schema: PrintBacklogSchema, onRequest },
    handleListPrintBacklog
  );
  http.get(`${prefix}`, { schema: ListOrdersSchema, onRequest }, handleListOrders);
  http.get(`${prefix}/:id`, { schema: GetOrderSchema, onRequest }, handleGetOrder);
  http.get(
    `${prefix}/:id/payment`,
    { schema: ListOrderPaymentsSchema, onRequest },
    handleListOrderPayments
  );
  http.post(
    `${prefix}/:id/payment`,
    { schema: CreateOrderPaymentSchema, onRequest },
    handleCreateOrderPayment
  );
  http.delete(
    `${prefix}/:id/payment/:paymentId`,
    { schema: DeleteOrderPaymentSchema, onRequest },
    handleDeleteOrderPayment
  );
  http.post(`${prefix}`, { schema: CreateOrderSchema, onRequest }, handleCreateOrder);
  http.post(
    `${prefix}/:id/send-to-production`,
    { schema: SendOrderToProductionSchema, onRequest },
    handleSendOrderToProduction
  );
  http.put(`${prefix}/:id`, { schema: UpdateOrderSchema, onRequest }, handleUpdateOrder);
  http.patch(`${prefix}/:id`, { schema: PatchOrderSchema, onRequest }, handlePatchOrder);
  http.patch(
    `${prefix}/:id/items/:itemId`,
    { schema: PatchOrderItemSchema, onRequest },
    handlePatchOrderItem
  );
  http.delete(`${prefix}/:id`, { schema: DeleteOrderSchema, onRequest }, handleDeleteOrder);
}

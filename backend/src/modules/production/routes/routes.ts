import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleCreateProductionShipment from '../controllers/create-production-shipment.controller';
import handleGetProductionGraphicSummary from '../controllers/get-production-graphic-summary.controller';
import handleListProductionShipments from '../controllers/list-production-shipments.controller';
import handleMoveProductionOrderItem from '../controllers/move-production-order-item.controller';
import handleRemoveProductionOrderItem from '../controllers/remove-production-order-item.controller';
import handlePatchProductionShipment from '../controllers/patch-production-shipment.controller';
import { CreateProductionShipmentSchema } from '../schemas/create-production-shipment.schema';
import { ListProductionShipmentsSchema } from '../schemas/list-production-shipments.schema';
import { MoveProductionOrderItemSchema } from '../schemas/move-production-order-item.schema';
import { RemoveProductionOrderItemSchema } from '../schemas/remove-production-order-item.schema';
import { PatchProductionShipmentSchema } from '../schemas/patch-production-shipment.schema';
import { ProductionGraphicSummarySchema } from '../schemas/production-graphic-summary.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/production`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}/shipment`, { schema: ListProductionShipmentsSchema, onRequest }, handleListProductionShipments);

  http.post(
    `${prefix}/shipment`,
    { schema: CreateProductionShipmentSchema, onRequest },
    handleCreateProductionShipment
  );

  http.patch(
    `${prefix}/shipment/:id`,
    { schema: PatchProductionShipmentSchema, onRequest },
    handlePatchProductionShipment
  );

  http.patch(
    `${prefix}/shipment/:id/order-item/:itemId/move`,
    { schema: MoveProductionOrderItemSchema, onRequest },
    handleMoveProductionOrderItem
  );

  http.patch(
    `${prefix}/shipment/:id/order-item/:itemId/remove-from-production`,
    { schema: RemoveProductionOrderItemSchema, onRequest },
    handleRemoveProductionOrderItem
  );

  http.get(
    `${prefix}/shipment/:id/graphic-summary`,
    { schema: ProductionGraphicSummarySchema, onRequest },
    handleGetProductionGraphicSummary
  );
}

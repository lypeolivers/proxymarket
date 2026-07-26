import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { OrderLineArtStatus } from '../../../common/schemas/order.schema';
import { CardEntity } from '../../card/entities/card.entity';

export const ProductionShipmentStatus = z.enum(['awaiting_print', 'printing', 'printed']);
export type TProductionShipmentStatus = z.infer<typeof ProductionShipmentStatus>;

export const ProductionShipmentPrintModelSnapshot = z.object({
  id: z.number(),
  name: z.string(),
  file_name: z.string(),
});

export const ProductionShipmentLineEntity = z.object({
  order_item_id: z.number(),
  quantity: z.number().int(),
  art_status: OrderLineArtStatus,
  has_varnish: z.boolean(),
  order_id: z.number(),
  customer_id: z.number(),
  customer_name: z.string(),
  card: CardEntity,
  card_print_model: ProductionShipmentPrintModelSnapshot.nullable(),
});

export type TProductionShipmentLineEntity = z.infer<typeof ProductionShipmentLineEntity>;

export const ProductionShipmentListItemEntity = z.object({
  id: z.number(),
  display_number: z.number().int(),
  status: ProductionShipmentStatus,
  lines: z.array(ProductionShipmentLineEntity),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export type TProductionShipmentListItemEntity = z.infer<typeof ProductionShipmentListItemEntity>;

export const ListProductionShipmentsResponse = z.object({
  items: z.array(ProductionShipmentListItemEntity),
});

export type TListProductionShipmentsResponse = z.infer<typeof ListProductionShipmentsResponse>;

export const ListProductionShipmentsSchema = {
  response: {
    200: ListProductionShipmentsResponse,
    401: ErrorResponse,
  },
  description: 'Lista remessas de produção com linhas de pedido.',
  tags: ['Production'],
};

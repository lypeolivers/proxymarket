import { z } from 'zod'

import { Card } from '@/modules/card/types/card.model'
import { OrderLineArtStatus } from '@/modules/order/types/order.model'

export const ProductionShipmentStatus = z.enum(['awaiting_print', 'printing', 'printed'])
export type TProductionShipmentStatus = z.infer<typeof ProductionShipmentStatus>

export const ProductionShipmentPrintModelSnapshot = z.object({
  id: z.number(),
  name: z.string(),
  file_name: z.string(),
})

export const ProductionShipmentLine = z.object({
  order_item_id: z.number(),
  quantity: z.number(),
  art_status: OrderLineArtStatus,
  order_id: z.number(),
  customer_id: z.number(),
  customer_name: z.string(),
  card: Card,
  card_print_model: ProductionShipmentPrintModelSnapshot.nullable(),
})

export type TProductionShipmentLine = z.infer<typeof ProductionShipmentLine>

export const ProductionShipmentListItem = z.object({
  id: z.number(),
  display_number: z.number(),
  status: ProductionShipmentStatus,
  lines: z.array(ProductionShipmentLine),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TProductionShipmentListItem = z.infer<typeof ProductionShipmentListItem>

export const ListProductionShipmentsResponse = z.object({
  items: z.array(ProductionShipmentListItem),
})

export type TListProductionShipmentsResponse = z.infer<typeof ListProductionShipmentsResponse>

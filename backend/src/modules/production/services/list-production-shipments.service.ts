import { prisma } from '../../../infra/database/prisma';
import { CardEntity } from '../../card/entities/card.entity';
import {
  ListProductionShipmentsResponse,
  type TListProductionShipmentsResponse,
} from '../schemas/list-production-shipments.schema';

export class ListProductionShipmentsService {
  async execute(): Promise<TListProductionShipmentsResponse> {
    const shipments = await prisma.productionShipment.findMany({
      where: { is_deleted: false },
      orderBy: { display_number: 'desc' },
      include: {
        order_items: {
          where: { is_deleted: false },
          orderBy: { id: 'asc' },
          include: {
            order: {
              select: {
                id: true,
                customer: { select: { id: true, name: true } },
              },
            },
            card: true,
            card_print_model: {
              select: { id: true, name: true, file_name: true },
            },
          },
        },
      },
    });

    const items = shipments.map((shipment) => ({
      id: shipment.id,
      display_number: shipment.display_number,
      status: shipment.status,
      created_at: shipment.created_at,
      updated_at: shipment.updated_at,
      lines: shipment.order_items.map((row) => ({
        order_item_id: row.id,
        quantity: row.quantity,
        art_status: row.art_status,
        order_id: row.order.id,
        customer_id: row.order.customer.id,
        customer_name: row.order.customer.name,
        card: CardEntity.parse(row.card),
        card_print_model: row.card_print_model,
      })),
    }));

    return ListProductionShipmentsResponse.parse({ items });
  }
}

export const listProductionShipmentsService = new ListProductionShipmentsService();

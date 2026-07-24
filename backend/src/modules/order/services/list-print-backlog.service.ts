import { prisma } from '../../../infra/database/prisma';
import { ORDER_STATUSES_EXCLUDED_FROM_STOCK_DEMAND } from '../../../common/schemas/order.schema';
import {
  PrintBacklogResponse,
  TPrintBacklogQuery,
  TPrintBacklogResponse,
} from '../schemas/print-backlog.schema';

const ART_EXCLUDED_FROM_GRAPHIC_DEMAND: Array<'printing' | 'printed'> = ['printing', 'printed'];

const backlogItemWhere = {
  is_deleted: false,
  fulfill_from_stock: false,
  art_status: { notIn: ART_EXCLUDED_FROM_GRAPHIC_DEMAND },
} as const;

export class ListPrintBacklogService {
  async execute(query: TPrintBacklogQuery): Promise<TPrintBacklogResponse> {
    const limit = query.limit ?? 50;

    const orders = await prisma.order.findMany({
      where: {
        is_deleted: false,
        order_status: { notIn: [...ORDER_STATUSES_EXCLUDED_FROM_STOCK_DEMAND] },
        items: { some: backlogItemWhere },
      },
      include: {
        customer: { select: { name: true } },
        items: {
          where: backlogItemWhere,
          select: {
            quantity: true,
            card_print_model_id: true,
          },
        },
      },
      orderBy: [{ order_date: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    const items = orders.map((order) => {
      const lines = order.items;
      return {
        order_id: order.id,
        customer_name: order.customer.name,
        order_status: order.order_status,
        pending_print_lines: lines.length,
        missing_model_lines: lines.filter((line) => line.card_print_model_id == null).length,
        total_units: lines.reduce((sum, line) => sum + line.quantity, 0),
      };
    });

    return PrintBacklogResponse.parse({ items });
  }
}

export const listPrintBacklogService = new ListPrintBacklogService();

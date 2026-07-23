import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  ListCustomerGiftsResponse,
  TListCustomerGiftsResponse,
} from '../schemas/customer-gift.schema';
import { mapCustomerGiftRecord } from '../entities/customer-gift.entity';
import { sumGiftUnitsRemaining } from './reconcile-customer-gift-usage.service';

export class ListCustomerGiftsService {
  async execute(customerId: number): Promise<TListCustomerGiftsResponse> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, is_deleted: false },
      select: { id: true },
    });

    if (!customer) {
      throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
    }

    const gifts = await prisma.customerGift.findMany({
      where: { customer_id: customerId, is_deleted: false },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });

    const items = gifts.map(mapCustomerGiftRecord);

    return ListCustomerGiftsResponse.parse({
      items,
      gift_units_remaining: sumGiftUnitsRemaining(gifts),
    });
  }
}

export const listCustomerGiftsService = new ListCustomerGiftsService();

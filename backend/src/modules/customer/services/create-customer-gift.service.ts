import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  CreateCustomerGiftResponse,
  TCreateCustomerGiftBody,
  TCreateCustomerGiftResponse,
} from '../schemas/customer-gift.schema';
import { mapCustomerGiftRecord } from '../entities/customer-gift.entity';

export class CreateCustomerGiftService {
  async execute(
    customerId: number,
    data: TCreateCustomerGiftBody
  ): Promise<TCreateCustomerGiftResponse> {
    const result = await runInTransaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        where: { id: customerId, is_deleted: false },
        select: { id: true },
      });

      if (!customer) {
        throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
      }

      const gift = await transaction.customerGift.create({
        data: {
          customer_id: customerId,
          quantity_granted: data.quantity,
          quantity_used: 0,
          notes: data.notes?.trim() || null,
        },
      });

      return mapCustomerGiftRecord(gift);
    });

    return CreateCustomerGiftResponse.parse(result);
  }
}

export const createCustomerGiftService = new CreateCustomerGiftService();

import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import {
  DeleteCustomerGiftResponse,
  TDeleteCustomerGiftResponse,
} from '../schemas/customer-gift.schema';

export class DeleteCustomerGiftService {
  async execute(customerId: number, giftId: number): Promise<TDeleteCustomerGiftResponse> {
    const result = await runInTransaction(async (transaction) => {
      const gift = await transaction.customerGift.findFirst({
        where: { id: giftId, customer_id: customerId, is_deleted: false },
      });

      if (!gift) {
        throw ApiError('not-found', 'Brinde não encontrado', undefined, 404);
      }

      if (gift.quantity_used > 0) {
        throw ApiError(
          'gift-already-used',
          'Não é possível remover um brinde que já foi utilizado.',
          undefined,
          400
        );
      }

      await transaction.customerGift.update({
        where: { id: giftId },
        data: { is_deleted: true },
      });

      return { id: giftId };
    });

    return DeleteCustomerGiftResponse.parse(result);
  }
}

export const deleteCustomerGiftService = new DeleteCustomerGiftService();

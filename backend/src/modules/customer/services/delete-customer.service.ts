import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  DeleteCustomerResponse,
  TDeleteCustomerResponse,
} from '../schemas/delete-customer.schema';

export class DeleteCustomerService {
  async execute(id: number): Promise<TDeleteCustomerResponse> {
    const existing = await prisma.customer.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
    }

    await prisma.customer.update({
      where: { id },
      data: { is_deleted: true },
    });

    return DeleteCustomerResponse.parse({ id });
  }
}

export const deleteCustomerService = new DeleteCustomerService();

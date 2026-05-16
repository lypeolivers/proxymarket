import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  GetCustomerResponse,
  TGetCustomerResponse,
} from '../schemas/get-customer.schema';

export class GetCustomerService {
  async execute(id: number): Promise<TGetCustomerResponse> {
    const customer = await prisma.customer.findFirst({
      where: { id, is_deleted: false },
    });

    if (!customer) {
      throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
    }

    return GetCustomerResponse.parse(customer);
  }
}

export const getCustomerService = new GetCustomerService();

import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import {
  TUpdateCustomerBody,
  TUpdateCustomerResponse,
  UpdateCustomerResponse,
} from '../schemas/update-customer.schema';

export class UpdateCustomerService {
  async execute(id: number, data: TUpdateCustomerBody): Promise<TUpdateCustomerResponse> {
    const existing = await prisma.customer.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw ApiError('not-found', 'Cliente não encontrado', undefined, 404);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        city: data.city ?? null,
        state: data.state ?? null,
        notes: data.notes?.trim() || null,
      },
    });

    return UpdateCustomerResponse.parse(customer);
  }
}

export const updateCustomerService = new UpdateCustomerService();

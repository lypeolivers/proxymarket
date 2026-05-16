import { prisma } from '../../../infra/database/prisma';
import {
  CreateCustomerResponse,
  TCreateCustomerBody,
  TCreateCustomerResponse,
} from '../schemas/create-customer.schema';

export class CreateCustomerService {
  async execute(data: TCreateCustomerBody): Promise<TCreateCustomerResponse> {
    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        city: data.city ?? null,
        state: data.state ?? null,
        notes: data.notes?.trim() || null,
      },
    });

    return CreateCustomerResponse.parse(customer);
  }
}

export const createCustomerService = new CreateCustomerService();

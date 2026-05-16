import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CustomerEntity } from '../entities/customer.entity';

export const GetCustomerParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TGetCustomerParams = z.infer<typeof GetCustomerParams>;

export const GetCustomerResponse = CustomerEntity;
export type TGetCustomerResponse = z.infer<typeof GetCustomerResponse>;

export const GetCustomerSchema = {
  params: GetCustomerParams,
  response: {
    200: GetCustomerResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Busca um cliente por id.',
  tags: ['Customer'],
};

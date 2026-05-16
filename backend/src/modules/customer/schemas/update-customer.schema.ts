import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CustomerEntity } from '../entities/customer.entity';
import { CreateCustomerBody } from './create-customer.schema';

export const UpdateCustomerParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TUpdateCustomerParams = z.infer<typeof UpdateCustomerParams>;

export const UpdateCustomerBody = CreateCustomerBody;
export type TUpdateCustomerBody = z.infer<typeof UpdateCustomerBody>;

export const UpdateCustomerResponse = CustomerEntity;
export type TUpdateCustomerResponse = z.infer<typeof UpdateCustomerResponse>;

export const UpdateCustomerSchema = {
  params: UpdateCustomerParams,
  body: UpdateCustomerBody,
  response: {
    200: UpdateCustomerResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Atualiza um cliente.',
  tags: ['Customer'],
};

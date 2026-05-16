import { z } from 'zod';
import { CustomerCityField, CustomerStateField } from '../../../common/schemas/brazil-uf.schema';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CustomerEntity } from '../entities/customer.entity';

export const CreateCustomerBody = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cliente.'),
  phone: z.string().trim().optional().nullable(),
  email: z.union([z.string().trim().email('Informe um e-mail válido.'), z.literal('')]).optional().nullable().transform((value) => value || null),
  city: CustomerCityField.optional(),
  state: CustomerStateField.optional(),
  notes: z.string().trim().optional().nullable(),
});

export type TCreateCustomerBody = z.infer<typeof CreateCustomerBody>;

export const CreateCustomerResponse = CustomerEntity;
export type TCreateCustomerResponse = z.infer<typeof CreateCustomerResponse>;

export const CreateCustomerSchema = {
  body: CreateCustomerBody,
  response: {
    201: CreateCustomerResponse,
    400: ErrorResponse,
    401: ErrorResponse,
  },
  description: 'Cria um cliente.',
  tags: ['Customer'],
};

import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';

export const DeleteCustomerParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type TDeleteCustomerParams = z.infer<typeof DeleteCustomerParams>;

export const DeleteCustomerResponse = z.object({
  id: z.number(),
});

export type TDeleteCustomerResponse = z.infer<typeof DeleteCustomerResponse>;

export const DeleteCustomerSchema = {
  params: DeleteCustomerParams,
  response: {
    200: DeleteCustomerResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Remove um cliente (soft delete).',
  tags: ['Customer'],
};

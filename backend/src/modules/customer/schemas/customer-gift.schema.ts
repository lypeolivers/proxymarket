import { z } from 'zod';
import { ErrorResponse } from '../../../common/schemas/error-response.schema';
import { CustomerGiftEntity } from '../entities/customer-gift.entity';

export const CustomerGiftParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const CustomerGiftItemParams = CustomerGiftParams.extend({
  giftId: z.coerce.number().int().positive(),
});

export type TCustomerGiftParams = z.infer<typeof CustomerGiftParams>;
export type TCustomerGiftItemParams = z.infer<typeof CustomerGiftItemParams>;

export const CreateCustomerGiftBody = z.object({
  quantity: z.coerce.number().int().min(1, 'Informe ao menos 1 carta de brinde.'),
  notes: z.string().trim().optional().nullable(),
});

export type TCreateCustomerGiftBody = z.infer<typeof CreateCustomerGiftBody>;

export const ListCustomerGiftsResponse = z.object({
  items: z.array(CustomerGiftEntity),
  gift_units_remaining: z.number(),
});

export type TListCustomerGiftsResponse = z.infer<typeof ListCustomerGiftsResponse>;

export const CreateCustomerGiftResponse = CustomerGiftEntity;
export type TCreateCustomerGiftResponse = z.infer<typeof CreateCustomerGiftResponse>;

export const DeleteCustomerGiftResponse = z.object({
  id: z.number(),
});

export type TDeleteCustomerGiftResponse = z.infer<typeof DeleteCustomerGiftResponse>;

export const ListCustomerGiftsSchema = {
  params: CustomerGiftParams,
  response: {
    200: ListCustomerGiftsResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Lista brindes concedidos a um cliente.',
  tags: ['Customer'],
};

export const CreateCustomerGiftSchema = {
  params: CustomerGiftParams,
  body: CreateCustomerGiftBody,
  response: {
    201: CreateCustomerGiftResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Concede brinde genérico (cartas grátis) a um cliente.',
  tags: ['Customer'],
};

export const DeleteCustomerGiftSchema = {
  params: CustomerGiftItemParams,
  response: {
    200: DeleteCustomerGiftResponse,
    400: ErrorResponse,
    401: ErrorResponse,
    404: ErrorResponse,
  },
  description: 'Remove brinde não utilizado.',
  tags: ['Customer'],
};

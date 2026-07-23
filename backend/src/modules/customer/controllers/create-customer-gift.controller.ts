import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TCreateCustomerGiftBody,
  TCreateCustomerGiftResponse,
  TCustomerGiftParams,
} from '../schemas/customer-gift.schema';
import { createCustomerGiftService } from '../services/create-customer-gift.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TCustomerGiftParams;
    Body: TCreateCustomerGiftBody;
    Reply: TCreateCustomerGiftResponse;
  }>,
  reply: FastifyReply
) {
  const result = await createCustomerGiftService.execute(request.params.id, request.body);
  reply.status(201).send(result);
}

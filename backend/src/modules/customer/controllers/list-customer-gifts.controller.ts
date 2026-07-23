import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TCustomerGiftParams,
  TListCustomerGiftsResponse,
} from '../schemas/customer-gift.schema';
import { listCustomerGiftsService } from '../services/list-customer-gifts.service';

export default async function handle(
  request: FastifyRequest<{ Params: TCustomerGiftParams; Reply: TListCustomerGiftsResponse }>,
  reply: FastifyReply
) {
  const result = await listCustomerGiftsService.execute(request.params.id);
  reply.status(200).send(result);
}

import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TCustomerGiftItemParams,
  TDeleteCustomerGiftResponse,
} from '../schemas/customer-gift.schema';
import { deleteCustomerGiftService } from '../services/delete-customer-gift.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TCustomerGiftItemParams;
    Reply: TDeleteCustomerGiftResponse;
  }>,
  reply: FastifyReply
) {
  const result = await deleteCustomerGiftService.execute(
    request.params.id,
    request.params.giftId
  );
  reply.status(200).send(result);
}

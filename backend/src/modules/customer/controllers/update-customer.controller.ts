import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TUpdateCustomerBody,
  TUpdateCustomerParams,
  TUpdateCustomerResponse,
} from '../schemas/update-customer.schema';
import { updateCustomerService } from '../services/update-customer.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TUpdateCustomerParams;
    Body: TUpdateCustomerBody;
    Reply: TUpdateCustomerResponse;
  }>,
  reply: FastifyReply
) {
  const result = await updateCustomerService.execute(request.params.id, request.body);
  reply.status(200).send(result);
}

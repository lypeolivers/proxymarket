import { FastifyReply, FastifyRequest } from 'fastify';
import { TGetCustomerParams, TGetCustomerResponse } from '../schemas/get-customer.schema';
import { getCustomerService } from '../services/get-customer.service';

export default async function handle(
  request: FastifyRequest<{ Params: TGetCustomerParams; Reply: TGetCustomerResponse }>,
  reply: FastifyReply
) {
  const result = await getCustomerService.execute(request.params.id);
  reply.status(200).send(result);
}

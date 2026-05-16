import { FastifyReply, FastifyRequest } from 'fastify';
import { TDeleteCustomerParams, TDeleteCustomerResponse } from '../schemas/delete-customer.schema';
import { deleteCustomerService } from '../services/delete-customer.service';

export default async function handle(
  request: FastifyRequest<{ Params: TDeleteCustomerParams; Reply: TDeleteCustomerResponse }>,
  reply: FastifyReply
) {
  const result = await deleteCustomerService.execute(request.params.id);
  reply.status(200).send(result);
}

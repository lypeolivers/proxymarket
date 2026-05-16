import { FastifyReply, FastifyRequest } from 'fastify';
import { TCreateCustomerBody, TCreateCustomerResponse } from '../schemas/create-customer.schema';
import { createCustomerService } from '../services/create-customer.service';

export default async function handle(
  request: FastifyRequest<{ Body: TCreateCustomerBody; Reply: TCreateCustomerResponse }>,
  reply: FastifyReply
) {
  const result = await createCustomerService.execute(request.body);
  reply.status(201).send(result);
}

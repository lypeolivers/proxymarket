import { FastifyReply, FastifyRequest } from 'fastify';
import { TListCustomersQuery, TListCustomersResponse } from '../schemas/list-customers.schema';
import { listCustomersService } from '../services/list-customers.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TListCustomersQuery; Reply: TListCustomersResponse }>,
  reply: FastifyReply
) {
  const result = await listCustomersService.execute(request.query);
  reply.status(200).send(result);
}

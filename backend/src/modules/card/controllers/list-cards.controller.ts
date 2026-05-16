import { FastifyReply, FastifyRequest } from 'fastify';
import { TListCardsQuery, TListCardsResponse } from '../schemas/list-cards.schema';
import { listCardsService } from '../services/list-cards.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TListCardsQuery; Reply: TListCardsResponse }>,
  reply: FastifyReply
) {
  const result = await listCardsService.execute(request.query);
  reply.status(200).send(result);
}

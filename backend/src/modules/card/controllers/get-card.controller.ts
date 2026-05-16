import { FastifyReply, FastifyRequest } from 'fastify';
import { TGetCardParams, TGetCardResponse } from '../schemas/get-card.schema';
import { getCardService } from '../services/get-card.service';

export default async function handle(
  request: FastifyRequest<{ Params: TGetCardParams; Reply: TGetCardResponse }>,
  reply: FastifyReply
) {
  const result = await getCardService.execute(request.params.id);
  reply.status(200).send(result);
}

import { FastifyReply, FastifyRequest } from 'fastify';
import { TCreateCardBody, TCreateCardResponse } from '../schemas/create-card.schema';
import { createCardService } from '../services/create-card.service';

export default async function handle(
  request: FastifyRequest<{ Body: TCreateCardBody; Reply: TCreateCardResponse }>,
  reply: FastifyReply
) {
  const result = await createCardService.execute(request.body);
  reply.status(201).send(result);
}

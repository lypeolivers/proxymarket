import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TDeleteCardParams,
  TDeleteCardResponse,
} from '../schemas/delete-card.schema';
import { deleteCardService } from '../services/delete-card.service';

export default async function handle(
  request: FastifyRequest<{ Params: TDeleteCardParams; Reply: TDeleteCardResponse }>,
  reply: FastifyReply
) {
  const result = await deleteCardService.execute(request.params.id);
  reply.status(200).send(result);
}

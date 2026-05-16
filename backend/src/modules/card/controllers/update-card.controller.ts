import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TUpdateCardBody,
  TUpdateCardParams,
  TUpdateCardResponse,
} from '../schemas/update-card.schema';
import { updateCardService } from '../services/update-card.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TUpdateCardParams;
    Body: TUpdateCardBody;
    Reply: TUpdateCardResponse;
  }>,
  reply: FastifyReply
) {
  const result = await updateCardService.execute(request.params.id, request.body);
  reply.status(200).send(result);
}

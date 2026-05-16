import { FastifyReply, FastifyRequest } from 'fastify';
import { TUpdateMeBody, TUpdateMeResponse } from '../schemas/update-me.schema';
import { updateMeService } from '../services/update-me.service';

export default async function handle(
  request: FastifyRequest<{ Body: TUpdateMeBody; Reply: TUpdateMeResponse }>,
  reply: FastifyReply
) {
  const result = await updateMeService.execute(request.userId, request.body);
  reply.status(200).send(result);
}

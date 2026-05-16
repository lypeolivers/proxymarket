import { FastifyReply, FastifyRequest } from 'fastify';
import { TGetMeResponse } from '../schemas/get-me.schema';
import { getMeService } from '../services/get-me.service';

export default async function handle(
  request: FastifyRequest<{ Reply: TGetMeResponse }>,
  reply: FastifyReply
) {
  const result = await getMeService.execute(request.userId);
  reply.status(200).send(result);
}

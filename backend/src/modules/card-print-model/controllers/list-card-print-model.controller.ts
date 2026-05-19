import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TListCardPrintModelQuery,
  type TListCardPrintModelResponse,
} from '../schemas/list-card-print-model.schema';
import { listCardPrintModelService } from '../services/list-card-print-model.service';

export default async function handle(
  request: FastifyRequest<{ Querystring: TListCardPrintModelQuery; Reply: TListCardPrintModelResponse }>,
  reply: FastifyReply
) {
  const result = await listCardPrintModelService.execute(request.query);
  reply.status(200).send(result);
}

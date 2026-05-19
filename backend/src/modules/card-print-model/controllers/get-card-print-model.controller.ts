import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TGetCardPrintModelParams,
  type TGetCardPrintModelResponse,
} from '../schemas/get-card-print-model.schema';
import { getCardPrintModelService } from '../services/get-card-print-model.service';

export default async function handle(
  request: FastifyRequest<{ Params: TGetCardPrintModelParams; Reply: TGetCardPrintModelResponse }>,
  reply: FastifyReply
) {
  const result = await getCardPrintModelService.execute(request.params.id);
  reply.status(200).send(result);
}

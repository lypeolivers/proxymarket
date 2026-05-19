import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TDeleteCardPrintModelParams,
  type TDeleteCardPrintModelResponse,
} from '../schemas/delete-card-print-model.schema';
import { deleteCardPrintModelService } from '../services/delete-card-print-model.service';

export default async function handle(
  request: FastifyRequest<{ Params: TDeleteCardPrintModelParams; Reply: TDeleteCardPrintModelResponse }>,
  reply: FastifyReply
) {
  const result = await deleteCardPrintModelService.execute(request.params.id);
  reply.status(200).send(result);
}

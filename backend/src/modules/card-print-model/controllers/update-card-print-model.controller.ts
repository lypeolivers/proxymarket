import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TUpdateCardPrintModelBody,
  type TUpdateCardPrintModelParams,
  type TUpdateCardPrintModelResponse,
} from '../schemas/update-card-print-model.schema';
import { updateCardPrintModelService } from '../services/update-card-print-model.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TUpdateCardPrintModelParams;
    Body: TUpdateCardPrintModelBody;
    Reply: TUpdateCardPrintModelResponse;
  }>,
  reply: FastifyReply
) {
  const result = await updateCardPrintModelService.execute(request.params.id, request.body);
  reply.status(200).send(result);
}

import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TCreateCardPrintModelBody,
  type TCreateCardPrintModelResponse,
} from '../schemas/create-card-print-model.schema';
import { createCardPrintModelService } from '../services/create-card-print-model.service';

export default async function handle(
  request: FastifyRequest<{ Body: TCreateCardPrintModelBody; Reply: TCreateCardPrintModelResponse }>,
  reply: FastifyReply
) {
  const result = await createCardPrintModelService.execute(request.body);
  reply.status(201).send(result);
}

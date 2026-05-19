import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TPatchStockBody,
  TPatchStockParams,
  TPatchStockResponse,
} from '../schemas/patch-stock.schema';
import { patchStockService } from '../services/patch-stock.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TPatchStockParams;
    Body: TPatchStockBody;
    Reply: TPatchStockResponse;
  }>,
  reply: FastifyReply
) {
  const result = await patchStockService.execute(
    request.params.cardId,
    request.body,
    request.userId
  );
  reply.status(200).send(result);
}

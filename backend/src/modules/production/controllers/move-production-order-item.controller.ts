import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TMoveProductionOrderItemParams,
  type TMoveProductionOrderItemResponse,
} from '../schemas/move-production-order-item.schema';
import { moveProductionOrderItemService } from '../services/move-production-order-item.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TMoveProductionOrderItemParams;
    Reply: TMoveProductionOrderItemResponse;
  }>,
  reply: FastifyReply
) {
  const result = await moveProductionOrderItemService.execute(
    request.params.id,
    request.params.itemId
  );
  reply.status(200).send(result);
}

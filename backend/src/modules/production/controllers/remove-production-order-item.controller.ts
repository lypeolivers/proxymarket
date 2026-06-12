import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TRemoveProductionOrderItemParams,
  type TRemoveProductionOrderItemResponse,
} from '../schemas/remove-production-order-item.schema';
import { removeProductionOrderItemService } from '../services/remove-production-order-item.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TRemoveProductionOrderItemParams;
    Reply: TRemoveProductionOrderItemResponse;
  }>,
  reply: FastifyReply
) {
  const result = await removeProductionOrderItemService.execute(
    request.params.id,
    request.params.itemId
  );
  reply.status(200).send(result);
}

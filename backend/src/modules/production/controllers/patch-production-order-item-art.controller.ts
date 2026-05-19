import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TPatchProductionOrderItemArtBody,
  type TPatchProductionOrderItemArtParams,
  type TPatchProductionOrderItemArtResponse,
} from '../schemas/patch-production-order-item-art.schema';
import { patchProductionOrderItemArtService } from '../services/patch-production-order-item-art.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TPatchProductionOrderItemArtParams;
    Body: TPatchProductionOrderItemArtBody;
    Reply: TPatchProductionOrderItemArtResponse;
  }>,
  reply: FastifyReply
) {
  const result = await patchProductionOrderItemArtService.execute(
    request.params.id,
    request.params.itemId,
    request.body
  );
  reply.status(200).send(result);
}

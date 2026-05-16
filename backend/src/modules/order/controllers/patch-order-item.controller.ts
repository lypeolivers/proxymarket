import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TPatchOrderItemBody,
  TPatchOrderItemParams,
  TPatchOrderItemResponse,
} from '../schemas/patch-order-item.schema';
import { patchOrderItemService } from '../services/patch-order-item.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TPatchOrderItemParams;
    Body: TPatchOrderItemBody;
    Reply: TPatchOrderItemResponse;
  }>,
  reply: FastifyReply
) {
  const result = await patchOrderItemService.execute(
    request.params.id,
    request.params.itemId,
    request.body
  );
  reply.status(200).send(result);
}

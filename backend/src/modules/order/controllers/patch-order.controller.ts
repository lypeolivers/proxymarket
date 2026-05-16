import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TPatchOrderBody,
  TPatchOrderParams,
  TPatchOrderResponse,
} from '../schemas/patch-order.schema';
import { patchOrderService } from '../services/patch-order.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TPatchOrderParams;
    Body: TPatchOrderBody;
    Reply: TPatchOrderResponse;
  }>,
  reply: FastifyReply
) {
  const result = await patchOrderService.execute(request.params.id, request.body);
  reply.status(200).send(result);
}

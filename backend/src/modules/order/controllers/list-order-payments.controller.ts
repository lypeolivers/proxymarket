import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TListOrderPaymentsParams,
  TListOrderPaymentsResponse,
} from '../schemas/list-order-payments.schema';
import { listOrderPaymentsService } from '../services/list-order-payments.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TListOrderPaymentsParams;
    Reply: TListOrderPaymentsResponse;
  }>,
  reply: FastifyReply
) {
  const result = await listOrderPaymentsService.execute(request.params.id);
  reply.status(200).send(result);
}

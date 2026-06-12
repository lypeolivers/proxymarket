import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TSendOrderToProductionParams,
  type TSendOrderToProductionResponse,
} from '../schemas/send-order-to-production.schema';
import { sendOrderToProductionService } from '../services/send-order-to-production.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TSendOrderToProductionParams;
    Reply: TSendOrderToProductionResponse;
  }>,
  reply: FastifyReply
) {
  const result = await sendOrderToProductionService.execute(request.params.id);
  reply.status(200).send(result);
}

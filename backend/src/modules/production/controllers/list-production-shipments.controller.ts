import { FastifyReply, FastifyRequest } from 'fastify';
import type { TListProductionShipmentsResponse } from '../schemas/list-production-shipments.schema';
import { listProductionShipmentsService } from '../services/list-production-shipments.service';

export default async function handle(
  request: FastifyRequest<{ Reply: TListProductionShipmentsResponse }>,
  reply: FastifyReply
) {
  const result = await listProductionShipmentsService.execute();
  reply.status(200).send(result);
}

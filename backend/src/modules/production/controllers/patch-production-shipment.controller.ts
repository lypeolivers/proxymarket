import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TPatchProductionShipmentBody,
  type TPatchProductionShipmentParams,
  type TPatchProductionShipmentResponse,
} from '../schemas/patch-production-shipment.schema';
import { patchProductionShipmentService } from '../services/patch-production-shipment.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TPatchProductionShipmentParams;
    Body: TPatchProductionShipmentBody;
    Reply: TPatchProductionShipmentResponse;
  }>,
  reply: FastifyReply
) {
  const result = await patchProductionShipmentService.execute(request.params.id, request.body);
  reply.status(200).send(result);
}

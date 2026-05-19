import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TCreateProductionShipmentBody,
  type TCreateProductionShipmentResponse,
} from '../schemas/create-production-shipment.schema';
import { createProductionShipmentService } from '../services/create-production-shipment.service';

export default async function handle(
  request: FastifyRequest<{
    Body: TCreateProductionShipmentBody;
    Reply: TCreateProductionShipmentResponse;
  }>,
  reply: FastifyReply
) {
  const result = await createProductionShipmentService.execute(request.body ?? {});
  reply.status(201).send(result);
}

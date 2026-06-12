import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TCreateOrderPaymentBody,
  TCreateOrderPaymentParams,
  TCreateOrderPaymentResponse,
} from '../schemas/create-order-payment.schema';
import { createOrderPaymentService } from '../services/create-order-payment.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TCreateOrderPaymentParams;
    Body: TCreateOrderPaymentBody;
    Reply: TCreateOrderPaymentResponse;
  }>,
  reply: FastifyReply
) {
  const result = await createOrderPaymentService.execute(request.params.id, request.body);
  reply.status(201).send(result);
}

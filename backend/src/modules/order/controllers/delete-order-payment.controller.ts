import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TDeleteOrderPaymentParams,
  TDeleteOrderPaymentResponse,
} from '../schemas/delete-order-payment.schema';
import { deleteOrderPaymentService } from '../services/delete-order-payment.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TDeleteOrderPaymentParams;
    Reply: TDeleteOrderPaymentResponse;
  }>,
  reply: FastifyReply
) {
  const result = await deleteOrderPaymentService.execute(
    request.params.id,
    request.params.paymentId
  );
  reply.status(200).send(result);
}

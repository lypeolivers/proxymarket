import { FastifyReply, FastifyRequest } from 'fastify';
import {
  TGetCustomerPurchaseInfoParams,
  TGetCustomerPurchaseInfoQuery,
  TGetCustomerPurchaseInfoResponse,
} from '../schemas/get-customer-purchase-info.schema';
import { getCustomerPurchaseInfoService } from '../services/get-customer-purchase-info.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TGetCustomerPurchaseInfoParams;
    Querystring: TGetCustomerPurchaseInfoQuery;
    Reply: TGetCustomerPurchaseInfoResponse;
  }>,
  reply: FastifyReply
) {
  const result = await getCustomerPurchaseInfoService.execute(
    request.params.id,
    request.query
  );
  reply.status(200).send(result);
}

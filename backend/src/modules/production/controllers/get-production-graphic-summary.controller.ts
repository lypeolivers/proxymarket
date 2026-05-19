import { FastifyReply, FastifyRequest } from 'fastify';
import {
  type TProductionGraphicSummaryParams,
  type TProductionGraphicSummaryResponse,
} from '../schemas/production-graphic-summary.schema';
import { getProductionGraphicSummaryService } from '../services/get-production-graphic-summary.service';

export default async function handle(
  request: FastifyRequest<{
    Params: TProductionGraphicSummaryParams;
    Reply: TProductionGraphicSummaryResponse;
  }>,
  reply: FastifyReply
) {
  const result = await getProductionGraphicSummaryService.execute(request.params.id);
  reply.status(200).send(result);
}

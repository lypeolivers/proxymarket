import { FastifyReply, FastifyRequest } from 'fastify';
import type { TGraphicSummaryResponse } from '../schemas/graphic-summary.schema';
import { getGraphicSummaryService } from '../services/get-graphic-summary.service';

export default async function handle(
  _request: FastifyRequest<{ Reply: TGraphicSummaryResponse }>,
  reply: FastifyReply
) {
  const result = await getGraphicSummaryService.execute();
  reply.status(200).send(result);
}

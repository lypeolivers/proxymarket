import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleGetGraphicSummary from '../controllers/get-graphic-summary.controller';
import handleListStock from '../controllers/list-stock.controller';
import handlePatchStock from '../controllers/patch-stock.controller';
import { GraphicSummarySchema } from '../schemas/graphic-summary.schema';
import { ListStockSchema } from '../schemas/list-stock.schema';
import { PatchStockSchema } from '../schemas/patch-stock.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/stock`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}`, { schema: ListStockSchema, onRequest }, handleListStock);
  http.get(
    `${prefix}/graphic-summary`,
    { schema: GraphicSummarySchema, onRequest },
    handleGetGraphicSummary
  );
  http.patch(`${prefix}/:cardId`, { schema: PatchStockSchema, onRequest }, handlePatchStock);
}
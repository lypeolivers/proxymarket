import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleCreateCardPrintModel from '../controllers/create-card-print-model.controller';
import handleDeleteCardPrintModel from '../controllers/delete-card-print-model.controller';
import handleGetCardPrintModel from '../controllers/get-card-print-model.controller';
import handleListCardPrintModel from '../controllers/list-card-print-model.controller';
import handleUpdateCardPrintModel from '../controllers/update-card-print-model.controller';
import { CreateCardPrintModelSchema } from '../schemas/create-card-print-model.schema';
import { DeleteCardPrintModelSchema } from '../schemas/delete-card-print-model.schema';
import { GetCardPrintModelSchema } from '../schemas/get-card-print-model.schema';
import { ListCardPrintModelSchema } from '../schemas/list-card-print-model.schema';
import { UpdateCardPrintModelSchema } from '../schemas/update-card-print-model.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/card-print-model`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}`, { schema: ListCardPrintModelSchema, onRequest }, handleListCardPrintModel);
  http.get(`${prefix}/:id`, { schema: GetCardPrintModelSchema, onRequest }, handleGetCardPrintModel);
  http.post(`${prefix}`, { schema: CreateCardPrintModelSchema, onRequest }, handleCreateCardPrintModel);
  http.patch(`${prefix}/:id`, { schema: UpdateCardPrintModelSchema, onRequest }, handleUpdateCardPrintModel);
  http.delete(`${prefix}/:id`, { schema: DeleteCardPrintModelSchema, onRequest }, handleDeleteCardPrintModel);
}

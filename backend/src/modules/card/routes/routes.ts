import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleCreateCard from '../controllers/create-card.controller';
import handleDeleteCard from '../controllers/delete-card.controller';
import handleGetCard from '../controllers/get-card.controller';
import handleListCards from '../controllers/list-cards.controller';
import handleUpdateCard from '../controllers/update-card.controller';
import { CreateCardSchema } from '../schemas/create-card.schema';
import { DeleteCardSchema } from '../schemas/delete-card.schema';
import { GetCardSchema } from '../schemas/get-card.schema';
import { ListCardsSchema } from '../schemas/list-cards.schema';
import { UpdateCardSchema } from '../schemas/update-card.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/card`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}`, { schema: ListCardsSchema, onRequest }, handleListCards);
  http.get(`${prefix}/:id`, { schema: GetCardSchema, onRequest }, handleGetCard);
  http.post(`${prefix}`, { schema: CreateCardSchema, onRequest }, handleCreateCard);
  http.put(`${prefix}/:id`, { schema: UpdateCardSchema, onRequest }, handleUpdateCard);
  http.delete(`${prefix}/:id`, { schema: DeleteCardSchema, onRequest }, handleDeleteCard);
}

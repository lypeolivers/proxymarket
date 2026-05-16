import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleGetMe from '../controllers/get-me.controller';
import handleUpdateMe from '../controllers/update-me.controller';
import { GetMeSchema } from '../schemas/get-me.schema';
import { UpdateMeSchema } from '../schemas/update-me.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/user`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}/me`, { schema: GetMeSchema, onRequest }, handleGetMe);
  http.put(`${prefix}/me`, { schema: UpdateMeSchema, onRequest }, handleUpdateMe);
}

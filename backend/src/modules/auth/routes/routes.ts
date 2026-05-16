import { FastifyInstance } from 'fastify';
import { signinRateLimitKey } from '../../../common/fastify/rate-limit';
import { env } from '../../../env';
import handleRefreshToken from '../controllers/refresh-token.controller';
import handleSignIn from '../controllers/signin.controller';
import handleSignOut from '../controllers/signout.controller';
import { RefreshTokenSchema } from '../schemas/refresh-token.schema';
import { SignInSchema } from '../schemas/signin.schema';

export default async function (app: FastifyInstance) {
  const prefix = `${env.BASE_URL}/auth`;

  app.post(
    `${prefix}/signin`,
    {
      schema: SignInSchema,
      config: {
        // Primeiro login: cliente ainda não tem o cookie csrf_token.
        csrfExempt: true,
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          hook: 'preHandler',
          keyGenerator: signinRateLimitKey,
        },
      },
    },
    handleSignIn
  );

  app.post(
    `${prefix}/refresh`,
    {
      schema: RefreshTokenSchema,
      config: {
        csrfExempt: true,
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    handleRefreshToken
  );

  app.post(
    `${prefix}/signout`,
    {
      config: {
        csrfExempt: true,
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    handleSignOut
  );
}

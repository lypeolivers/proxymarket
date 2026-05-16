import autoLoad from '@fastify/autoload';
import { FastifyInstance } from 'fastify';
import { join } from 'path';

export async function registerAutoLoadRoutes(app: FastifyInstance): Promise<void> {
  await app.register(autoLoad, {
    dir: join(process.cwd(), 'src/modules/'),
    matchFilter: (path) => path.split('/').at(-2) === 'routes',
    ignorePattern: /\.test\.(ts|js|mjs|cjs)$/i,
    dirNameRoutePrefix: false,
  });
}

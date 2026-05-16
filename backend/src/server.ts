import fastify from 'fastify';
import pkg from '../package.json';
import { register as registerErrorHandler } from './common/errors/error-handler';
import { registerFastifyPlugins } from './common/fastify';
import { env } from './env';

export const app = fastify({ logger: false, trustProxy: true });

await registerFastifyPlugins(app);
await registerErrorHandler(app);

const { PORT, APP_NAME, MODE } = env;

app
  .listen({
    host: '0.0.0.0',
    port: PORT,
  })
  .then(() => {
    console.log(' ');
    console.log('-------------------------------------');
    console.log(' ');
    console.log(`🟢  APPLICATION:    ${APP_NAME}`);
    console.log(`🟢  STATUS:         RUNNING`);
    console.log(`🟢  MODE:           ${MODE}`);
    console.log(`🟢  PORT:           ${env.PORT}`);
    console.log(`🟢  VERSION:        ${pkg.version}`);
    console.log(' ');
    console.log('-------------------------------------');
    console.log(' ');
  });

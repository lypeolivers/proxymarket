import helmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';
import { env } from '../../env';

export async function registerHelmet(app: FastifyInstance): Promise<void> {
  const isProd = env.MODE === 'PROD' || env.MODE === 'HMG';

  await app.register(helmet, {
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        'frame-ancestors': ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        'upgrade-insecure-requests': isProd ? [] : null,
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
    xFrameOptions: { action: 'deny' },
  });

  app.addHook('onSend', (_request, reply, _payload, done) => {
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    done();
  });
}

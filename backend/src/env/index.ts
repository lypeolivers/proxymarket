import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    VERSION: z.string().default('1.0.0'),
    MODE: z.enum(['LOCAL', 'DEV', 'HMG', 'PROD']).default('LOCAL'),
    PORT: z.coerce.number().default(3333),
    /**
     * Prefixo de todas as rotas (ex.: `/api`, `/proxymarket/api`).
     */
    BASE_URL: z.preprocess((val) => {
      const raw = val === undefined || val === null ? '' : String(val).trim();
      if (raw === '') return '/api';
      const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
      return withLeading.replace(/\/+$/, '') || '/api';
    }, z.string()),
    PASSWORD_HASH_SALT_ROUNDS: z.coerce.number().default(10),
    DEFAULT_PRISMA_TRANSACTION_TIMEOUT: z.coerce.number().default(30_000),
    APP_NAME: z.string().default('ProxyMarket API'),

    DATABASE_URL: z.string(),

    AUTH_JWT_ACCESS_TOKEN_SECRET: z.string(),
    AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN: z.any(),
    AUTH_JWT_REFRESH_TOKEN_SECRET: z.string(),
    AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN: z.any(),

    /** Origens permitidas pelo CORS (separadas por vírgula). */
    CORS_ALLOWED_ORIGINS: z.string().optional().default(''),

    /** URL pública do frontend — usada em links/CTAs. */
    APP_WEB_URL: z.string().optional().default('http://localhost:5173'),

    /** Credenciais do admin criado pelo `prisma db seed`. */
    ADMIN_NAME: z.string().optional().default('Administrador'),
    ADMIN_EMAIL: z.string().optional().default(''),
    ADMIN_PASSWORD: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.MODE !== 'PROD' && data.MODE !== 'HMG') return;
    const origins = (data.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (origins.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'CORS_ALLOWED_ORIGINS é obrigatório quando MODE é PROD ou HMG (ex.: https://app.exemplo.com,https://admin.exemplo.com)',
        path: ['CORS_ALLOWED_ORIGINS'],
      });
    }
  });

const envData = envSchema.safeParse(process.env);

if (!envData.success) {
  console.error('Invalid environment variables', envData.error.format());
  throw new Error('Invalid environment variables');
}

export const env = envData.data;

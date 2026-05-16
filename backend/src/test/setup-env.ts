/** Env fixo para Vitest — não depende do shell nem do .env do host. */
Object.assign(process.env, {
  VERSION: '1.0.0',
  MODE: 'LOCAL',
  PORT: '3333',
  BASE_URL: '/api',
  PASSWORD_HASH_SALT_ROUNDS: '4',
  DEFAULT_PRISMA_TRANSACTION_TIMEOUT: '30000',
  APP_NAME: 'proxymarket-api-test',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test',
  AUTH_JWT_ACCESS_TOKEN_SECRET: 'test-access-secret-key-32chars-min',
  AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN: '1h',
  AUTH_JWT_REFRESH_TOKEN_SECRET: 'test-refresh-secret-key-32chars-min',
  AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
});

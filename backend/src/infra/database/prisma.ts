import { PrismaClient } from '../../../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../../env';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
  log: env.MODE === 'DEV' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export type PrismaTransactionalClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

type TransactionCallback<T> = (prismaTransaction: PrismaTransactionalClient) => Promise<T>;

/**
 * Executa um bloco em transação. Quando `user_id` é informado, registra o
 * contexto via `set_config('app.current_user_id', …)` para que triggers de
 * auditoria possam consumir o valor.
 */
export const runInTransaction = async <T>(
  callback: TransactionCallback<T>,
  user_id?: number,
  timeout?: number
): Promise<T> => {
  const result = await prisma.$transaction(
    async (prismaTransaction) => {
      if (user_id) {
        await prismaTransaction.$executeRaw`SELECT set_config('app.current_user_id', ${user_id.toString()}, TRUE);`;
      }
      return callback(prismaTransaction);
    },
    { timeout: timeout ?? env.DEFAULT_PRISMA_TRANSACTION_TIMEOUT }
  );

  return result;
};

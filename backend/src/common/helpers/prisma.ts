/**
 * Re-export do helper de transação para manter compatibilidade com o padrão
 * "@/common/helpers/prisma" usado pelos serviços no teski.
 */
export { runInTransaction, prisma } from '../../infra/database/prisma';
export type { PrismaTransactionalClient } from '../../infra/database/prisma';

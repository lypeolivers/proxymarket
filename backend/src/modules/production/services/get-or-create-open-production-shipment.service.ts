import { ApiError } from '../../../common/errors/api-error';
import type { PrismaTransactionalClient } from '../../../infra/database/prisma';

/**
 * Remessa “aberta”: única em `awaiting_print`. Próximos pedidos associam itens a ela.
 * Se não existir, cria com `display_number` sequencial.
 */
export async function getOrCreateOpenProductionShipment(
  transaction: PrismaTransactionalClient
): Promise<number> {
  const open = await transaction.productionShipment.findMany({
    where: { status: 'awaiting_print', is_deleted: false },
    orderBy: { id: 'desc' },
    select: { id: true },
  });

  if (open.length > 1) {
    throw ApiError(
      'production-shipment-conflict',
      'Existem várias remessas em “Aguardando impressão”. Corrija os dados antes de salvar novos pedidos.',
      undefined,
      409
    );
  }

  if (open.length === 1) {
    return open[0]!.id;
  }

  const maxRow = await transaction.productionShipment.aggregate({
    _max: { display_number: true },
  });
  const nextDisplay = (maxRow._max.display_number ?? 0) + 1;

  const created = await transaction.productionShipment.create({
    data: {
      display_number: nextDisplay,
      status: 'awaiting_print',
    },
    select: { id: true },
  });

  return created.id;
}

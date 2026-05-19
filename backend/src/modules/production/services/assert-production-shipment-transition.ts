import type { ProductionShipmentStatus } from '../../../../prisma/generated/prisma/enums.js';
import { ApiError } from '../../../common/errors/api-error';

const ORDER: ProductionShipmentStatus[] = ['awaiting_print', 'printing', 'printed'];

export function assertProductionShipmentStatusTransition(
  from: ProductionShipmentStatus,
  to: ProductionShipmentStatus
): void {
  if (from === to) {
    return;
  }

  const fromIdx = ORDER.indexOf(from);
  const toIdx = ORDER.indexOf(to);

  if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) {
    throw ApiError(
      'invalid-shipment-status',
      'Transição de status da remessa inválida. Avance apenas: aguardando impressão → impressão → impresso.',
      undefined,
      400
    );
  }
}

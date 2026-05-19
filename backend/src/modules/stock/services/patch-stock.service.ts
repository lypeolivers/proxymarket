import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import type { TPatchStockBody } from '../schemas/patch-stock.schema';
import { assembleStockRowForCardId } from './assemble-stock-row.service';

export class PatchStockService {
  async execute(
    cardId: number,
    body: TPatchStockBody,
    userId?: number
  ): Promise<Awaited<ReturnType<typeof assembleStockRowForCardId>>> {
    await runInTransaction(async (tx) => {
      const card = await tx.card.findFirst({
        where: { id: cardId, is_deleted: false },
      });

      if (!card) {
        throw ApiError('CARD_NOT_FOUND', 'Carta não encontrada.', undefined, 404);
      }

      await tx.cardStock.upsert({
        where: { card_id: cardId },
        create: {
          card_id: cardId,
          quantity: body.quantity,
        },
        update: {
          quantity: body.quantity,
          is_deleted: false,
        },
      });
    }, userId);

    return assembleStockRowForCardId(cardId);
  }
}

export const patchStockService = new PatchStockService();

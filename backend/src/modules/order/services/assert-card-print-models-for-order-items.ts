import { ApiError } from '../../../common/errors/api-error';
import type { PrismaTransactionalClient } from '../../../infra/database/prisma';

export async function assertCardPrintModelsBelongToCards(
  items: Array<{ card_id: number; card_print_model_id: number }>,
  transaction: PrismaTransactionalClient
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const ids = [...new Set(items.map((item) => item.card_print_model_id))];
  const models = await transaction.cardPrintModel.findMany({
    where: { id: { in: ids }, is_deleted: false },
    select: { id: true, card_id: true },
  });

  const byId = new Map(models.map((row) => [row.id, row]));

  for (const item of items) {
    const model = byId.get(item.card_print_model_id);
    if (!model || model.card_id !== item.card_id) {
      throw ApiError(
        'invalid-print-model',
        'O modelo de impressão não corresponde à carta selecionada.',
        undefined,
        400
      );
    }
  }
}

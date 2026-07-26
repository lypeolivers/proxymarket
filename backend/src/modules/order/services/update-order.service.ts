import { ApiError } from '../../../common/errors/api-error';
import { runInTransaction } from '../../../infra/database/prisma';
import { TOrderItemInput } from '../../../common/schemas/order.schema';
import {
  TUpdateOrderBody,
  TUpdateOrderResponse,
  UpdateOrderResponse,
} from '../schemas/update-order.schema';
import { assertCardPrintModelsBelongToCards } from './assert-card-print-models-for-order-items';
import { assertOrderGiftLines } from './assert-order-gift-lines.service';
import {
  assertCardsExist,
  assertCustomerExists,
  loadOrderEntity,
} from './order-mapper';
import { assertStatusTransition, resolveOrderHeader } from './order-helpers';
import { reconcileCustomerGiftUsage } from '../../customer/services/reconcile-customer-gift-usage.service';

type ExistingItem = {
  id: number;
  card_id: number;
  card_print_model_id: number | null;
  customer_gift_id: number | null;
  fulfill_from_stock: boolean;
  has_varnish: boolean;
  quantity: number;
  unit_price: unknown;
  production_shipment_id: number | null;
  art_status: string;
};

function itemMatchesInput(existing: ExistingItem, input: TOrderItemInput): boolean {
  return (
    existing.card_id === input.card_id &&
    existing.quantity === input.quantity &&
    Number(existing.unit_price) === input.unit_price &&
    (existing.card_print_model_id ?? null) === (input.card_print_model_id ?? null) &&
    (existing.customer_gift_id ?? null) === (input.customer_gift_id ?? null) &&
    existing.fulfill_from_stock === input.fulfill_from_stock &&
    existing.has_varnish === (input.has_varnish ?? false)
  );
}

function itemSignature(input: TOrderItemInput): string {
  return [
    input.card_id,
    input.quantity,
    input.unit_price,
    input.card_print_model_id ?? '',
    input.customer_gift_id ?? '',
    input.fulfill_from_stock ? '1' : '0',
    input.has_varnish ? '1' : '0',
  ].join('|');
}

async function syncOrderItems(
  orderId: number,
  customerId: number,
  items: TOrderItemInput[],
  transaction: Parameters<typeof assertCustomerExists>[1]
) {
  await assertCardsExist(
    items.map((item) => item.card_id),
    transaction
  );

  await assertCardPrintModelsBelongToCards(
    items.map((item) => ({
      card_id: item.card_id,
      card_print_model_id: item.card_print_model_id,
    })),
    transaction
  );

  const existingItems = await transaction.orderItem.findMany({
    where: { order_id: orderId, is_deleted: false },
    select: {
      id: true,
      card_id: true,
      card_print_model_id: true,
      customer_gift_id: true,
      fulfill_from_stock: true,
      has_varnish: true,
      quantity: true,
      unit_price: true,
      production_shipment_id: true,
      art_status: true,
    },
  });

  const affectedGiftIds = new Set<number>();
  for (const existing of existingItems) {
    if (existing.customer_gift_id != null) affectedGiftIds.add(existing.customer_gift_id);
  }
  for (const item of items) {
    if (item.customer_gift_id != null) affectedGiftIds.add(item.customer_gift_id);
  }

  const validatedGiftIds = await assertOrderGiftLines(
    customerId,
    items,
    orderId,
    transaction
  );
  for (const giftId of validatedGiftIds) affectedGiftIds.add(giftId);

  const usedExistingIds = new Set<number>();
  const inputSignatures = items.map(itemSignature);
  const duplicateSignatures = new Set(
    inputSignatures.filter((sig, idx) => inputSignatures.indexOf(sig) !== idx)
  );

  for (const input of items) {
    const sig = itemSignature(input);
    const allowReuse = !duplicateSignatures.has(sig);

    const match = allowReuse
      ? existingItems.find(
          (existing) => !usedExistingIds.has(existing.id) && itemMatchesInput(existing, input)
        )
      : undefined;

    if (match) {
      usedExistingIds.add(match.id);
      continue;
    }

    await transaction.orderItem.create({
      data: {
        order_id: orderId,
        card_id: input.card_id,
        card_print_model_id: input.card_print_model_id,
        customer_gift_id: input.customer_gift_id ?? null,
        fulfill_from_stock: input.fulfill_from_stock,
        has_varnish: input.has_varnish ?? false,
        production_shipment_id: null,
        quantity: input.quantity,
        unit_price: input.unit_price,
        art_status: 'art_to_do',
      },
    });
  }

  for (const existing of existingItems) {
    if (!usedExistingIds.has(existing.id)) {
      await transaction.orderItem.update({
        where: { id: existing.id },
        data: { is_deleted: true },
      });
    }
  }

  await reconcileCustomerGiftUsage([...affectedGiftIds], transaction);
}

export class UpdateOrderService {
  async execute(id: number, data: TUpdateOrderBody): Promise<TUpdateOrderResponse> {
    const header = resolveOrderHeader(data);

    const result = await runInTransaction(async (transaction) => {
      const existing = await transaction.order.findFirst({
        where: { id, is_deleted: false },
      });

      if (!existing) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      assertStatusTransition(existing.order_status, header.order_status);

      await assertCustomerExists(data.customer_id, transaction);

      await transaction.order.update({
        where: { id },
        data: {
          customer_id: data.customer_id,
          order_date: data.order_date,
          order_status: header.order_status,
          delivery_method: header.delivery_method,
          notes: data.notes?.trim() || null,
        },
      });

      await syncOrderItems(id, data.customer_id, data.items, transaction);

      const loaded = await loadOrderEntity(id, transaction);
      if (!loaded) {
        throw ApiError('not-found', 'Pedido não encontrado', undefined, 404);
      }

      return loaded;
    });

    return UpdateOrderResponse.parse(result);
  }
}

export const updateOrderService = new UpdateOrderService();

import { ApiError } from '../../../common/errors/api-error';
import {
  ORDER_PIPELINE_ORDER,
  TDeliveryMethod,
  TOrderLineArtStatus,
  TOrderPipelineStatus,
} from '../../../common/schemas/order.schema';

export type OrderHeaderInput = {
  order_status?: TOrderPipelineStatus;
  delivery_method?: TDeliveryMethod | null;
};

export function assertOrderHeader(header: {
  order_status: TOrderPipelineStatus;
  delivery_method: TDeliveryMethod | null;
}) {
  const { order_status, delivery_method } = header;

  if (order_status === 'quote' && delivery_method != null) {
    throw ApiError(
      'invalid-order-status',
      'Pedidos em orçamento não podem ter forma de envio.',
      undefined,
      400
    );
  }

  if (order_status === 'delivered' && delivery_method == null) {
    throw ApiError(
      'invalid-order-status',
      'Informe a forma de envio ao marcar o pedido como entregue.',
      undefined,
      400
    );
  }
}

export function assertStatusTransition(
  from: TOrderPipelineStatus,
  to: TOrderPipelineStatus
): void {
  if (from === 'delivered' && to !== 'delivered') {
    throw ApiError(
      'invalid-order-status',
      'Não é possível alterar um pedido já entregue.',
      undefined,
      400
    );
  }

  const fromIdx = ORDER_PIPELINE_ORDER.indexOf(from);
  const toIdx = ORDER_PIPELINE_ORDER.indexOf(to);

  if (toIdx < fromIdx) {
    throw ApiError(
      'invalid-order-status',
      'Não é permitido reverter o status do pedido.',
      undefined,
      400
    );
  }
}

export function resolveOrderHeader(input: OrderHeaderInput) {
  const order_status = input.order_status ?? 'quote';
  let delivery_method = input.delivery_method ?? null;

  if (order_status === 'quote') {
    delivery_method = null;
  }

  assertOrderHeader({ order_status, delivery_method });

  return { order_status, delivery_method };
}

export function resolvePatchHeader(
  existing: { order_status: TOrderPipelineStatus; delivery_method: TDeliveryMethod | null },
  patch: OrderHeaderInput
): { order_status: TOrderPipelineStatus; delivery_method: TDeliveryMethod | null } {
  const order_status = patch.order_status ?? existing.order_status;
  let delivery_method =
    patch.delivery_method !== undefined ? patch.delivery_method : existing.delivery_method;

  if (patch.order_status !== undefined) {
    assertStatusTransition(existing.order_status, patch.order_status);
  }

  if (order_status === 'quote') {
    delivery_method = null;
  }

  assertOrderHeader({ order_status, delivery_method });

  return { order_status, delivery_method };
}

export function assertArtStatusChangeAllowed(order_status: TOrderPipelineStatus) {
  if (order_status === 'quote') {
    throw ApiError(
      'payment-required',
      'Atualize o status do pedido antes de alterar o status de arte dos itens.',
      undefined,
      400
    );
  }
}

export function resolveItemArtStatus(
  order_status: TOrderPipelineStatus,
  requested?: TOrderLineArtStatus
): TOrderLineArtStatus {
  if (order_status === 'quote') {
    return 'art_to_do';
  }

  return requested ?? 'art_to_do';
}

export function computeLineTotal(quantity: number, unit_price: number): number {
  return Math.round(quantity * unit_price * 100) / 100;
}

export function computeOrderTotal(
  items: Array<{ quantity: number; unit_price: number }>
): number {
  return Math.round(
    items.reduce((sum, item) => sum + computeLineTotal(item.quantity, item.unit_price), 0) * 100
  ) / 100;
}

export function toUnitPrice(value: unknown): number {
  return Number(value);
}

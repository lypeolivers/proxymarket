import { ApiError } from '../../../common/errors/api-error';
import {
  DEFAULT_DELIVERY_METHOD,
  TDeliveryMethod,
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

  if (order_status === 'withdrawn' && delivery_method != null) {
    throw ApiError(
      'invalid-order-status',
      'Pedidos em desistência não podem ter forma de envio.',
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

function applyDeliveredDeliveryDefault(
  order_status: TOrderPipelineStatus,
  delivery_method: TDeliveryMethod | null
): TDeliveryMethod | null {
  if (order_status === 'delivered' && delivery_method == null) {
    return DEFAULT_DELIVERY_METHOD;
  }
  return delivery_method;
}

/** Validates pipeline status change; any transition is allowed (including backward). */
export function assertStatusTransition(
  _from: TOrderPipelineStatus,
  _to: TOrderPipelineStatus
): void {
  // No forward-only or delivered lock — header consistency is checked in assertOrderHeader.
}

export function resolveOrderHeader(input: OrderHeaderInput) {
  const order_status = input.order_status ?? 'quote';
  let delivery_method = input.delivery_method ?? null;

  if (order_status === 'quote' || order_status === 'withdrawn') {
    delivery_method = null;
  }

  delivery_method = applyDeliveredDeliveryDefault(order_status, delivery_method);

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

  if (order_status === 'quote' || order_status === 'withdrawn') {
    delivery_method = null;
  }

  delivery_method = applyDeliveredDeliveryDefault(order_status, delivery_method);

  assertOrderHeader({ order_status, delivery_method });

  return { order_status, delivery_method };
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

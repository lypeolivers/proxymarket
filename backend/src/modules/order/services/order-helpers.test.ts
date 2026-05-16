import { describe, expect, it } from 'vitest';

import {
  assertStatusTransition,
  resolveOrderHeader,
  resolvePatchHeader,
} from './order-helpers';

describe('resolveOrderHeader', () => {
  it('defaults to quote and clears delivery_method', () => {
    const header = resolveOrderHeader({});
    expect(header).toEqual({
      order_status: 'quote',
      delivery_method: null,
    });
  });

  it('clears delivery when quote', () => {
    const header = resolveOrderHeader({
      order_status: 'quote',
      delivery_method: 'postal',
    });
    expect(header.delivery_method).toBeNull();
  });

  it('allows delivery when delivered', () => {
    const header = resolveOrderHeader({
      order_status: 'delivered',
      delivery_method: 'hand_delivery',
    });
    expect(header).toEqual({
      order_status: 'delivered',
      delivery_method: 'hand_delivery',
    });
  });
});

describe('assertStatusTransition', () => {
  it('allows forward moves', () => {
    expect(() => assertStatusTransition('quote', 'partial_payment')).not.toThrow();
    expect(() => assertStatusTransition('paid', 'ready_for_delivery')).not.toThrow();
  });

  it('rejects backward moves', () => {
    expect(() => assertStatusTransition('paid', 'quote')).toThrow();
  });

  it('locks delivered', () => {
    expect(() => assertStatusTransition('delivered', 'paid')).toThrow();
  });
});

describe('resolvePatchHeader', () => {
  it('merges with existing when fields omitted', () => {
    const next = resolvePatchHeader(
      { order_status: 'paid', delivery_method: 'postal' },
      {}
    );
    expect(next).toEqual({
      order_status: 'paid',
      delivery_method: 'postal',
    });
  });

  it('rejects backward status in patch', () => {
    expect(() =>
      resolvePatchHeader(
        { order_status: 'paid', delivery_method: 'postal' },
        { order_status: 'quote' },
      ),
    ).toThrow();
  });
});

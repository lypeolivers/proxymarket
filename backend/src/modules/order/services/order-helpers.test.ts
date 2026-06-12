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

  it('defaults delivery to postal when delivered without method', () => {
    const header = resolveOrderHeader({
      order_status: 'delivered',
    });
    expect(header).toEqual({
      order_status: 'delivered',
      delivery_method: 'postal',
    });
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

  it('allows backward moves', () => {
    expect(() => assertStatusTransition('paid', 'quote')).not.toThrow();
    expect(() => assertStatusTransition('delivered', 'paid')).not.toThrow();
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

  it('allows backward status in patch', () => {
    const next = resolvePatchHeader(
      { order_status: 'paid', delivery_method: 'postal' },
      { order_status: 'quote' },
    );
    expect(next).toEqual({
      order_status: 'quote',
      delivery_method: null,
    });
  });

  it('defaults delivery to postal when patching to delivered', () => {
    const next = resolvePatchHeader(
      { order_status: 'paid', delivery_method: null },
      { order_status: 'delivered' },
    );
    expect(next).toEqual({
      order_status: 'delivered',
      delivery_method: 'postal',
    });
  });
});

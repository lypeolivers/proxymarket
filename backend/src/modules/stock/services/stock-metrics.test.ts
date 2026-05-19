import { describe, expect, it } from 'vitest';
import { computeGraphicNeed, computeStockMetrics } from './stock-metrics';

describe('computeStockMetrics', () => {
  it('computes surplus and zero need when stock covers demand', () => {
    expect(
      computeStockMetrics({ on_hand: 10, demand_open: 4, demand_quote: 2 }),
    ).toEqual({ available_after_orders: 6, need_to_produce: 0 });
  });

  it('computes deficit and need_to_produce when demand exceeds stock', () => {
    expect(
      computeStockMetrics({ on_hand: 3, demand_open: 10, demand_quote: 1 }),
    ).toEqual({ available_after_orders: -7, need_to_produce: 7 });
  });

  it('ignores demand_quote in availability and need_to_produce', () => {
    expect(
      computeStockMetrics({ on_hand: 0, demand_open: 0, demand_quote: 99 }),
    ).toEqual({ available_after_orders: 0, need_to_produce: 0 });
  });
});

describe('computeGraphicNeed', () => {
  it('returns surplus coverage as zero need', () => {
    expect(computeGraphicNeed(10, 4)).toBe(0);
  });

  it('returns deficit as positive need', () => {
    expect(computeGraphicNeed(2, 10)).toBe(8);
  });
});

import { describe, expect, it } from 'vitest';

import { sumGiftUnitsRemaining } from './reconcile-customer-gift-usage.service';

describe('sumGiftUnitsRemaining', () => {
  it('sums remaining units across gifts', () => {
    expect(
      sumGiftUnitsRemaining([
        { quantity_granted: 3, quantity_used: 1 },
        { quantity_granted: 2, quantity_used: 2 },
        { quantity_granted: 1, quantity_used: 0 },
      ])
    ).toBe(3);
  });

  it('never returns negative remaining for over-used gifts', () => {
    expect(sumGiftUnitsRemaining([{ quantity_granted: 1, quantity_used: 5 }])).toBe(0);
  });
});

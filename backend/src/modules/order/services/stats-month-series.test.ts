import { describe, expect, it } from 'vitest';



import {

  buildLastNUtcMonthKeys,

  mergeMonthlyRevenueIntoSeries,

  startOfOldestMonthUtc,

} from './stats-month-series';



describe('buildLastNUtcMonthKeys', () => {

  it('returns N consecutive keys ending in current UTC month', () => {

    const keys = buildLastNUtcMonthKeys(3);

    expect(keys).toHaveLength(3);

    expect(keys[2]).toMatch(/^\d{4}-\d{2}$/);

  });

});



describe('startOfOldestMonthUtc', () => {

  it('returns first day of month for oldest bucket', () => {

    const d = startOfOldestMonthUtc(12);

    expect(d.getUTCDate()).toBe(1);

    expect(d.getUTCHours()).toBe(0);

  });

});



describe('mergeMonthlyRevenueIntoSeries', () => {

  it('fills missing months with zero', () => {

    const merged = mergeMonthlyRevenueIntoSeries(

      ['2026-01', '2026-02', '2026-03'],

      [

        { month_key: '2026-01', revenue: 100 },

        { month_key: '2026-03', revenue: 50 },

      ],

    );

    expect(merged).toEqual([

      { month: '2026-01', revenue: 100 },

      { month: '2026-02', revenue: 0 },

      { month: '2026-03', revenue: 50 },

    ]);

  });

});


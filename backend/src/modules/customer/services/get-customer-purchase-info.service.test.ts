import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  computePaginationPages,
  GetCustomerPurchaseInfoService,
} from './get-customer-purchase-info.service';

const mockFindFirst = vi.fn();
const mockOrderCount = vi.fn();
const mockQueryRaw = vi.fn();
const mockOrderItemFindMany = vi.fn();
const mockOrderItemCount = vi.fn();

vi.mock('../../../infra/database/prisma', () => ({
  prisma: {
    customer: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    order: { count: (...args: unknown[]) => mockOrderCount(...args) },
    orderItem: {
      findMany: (...args: unknown[]) => mockOrderItemFindMany(...args),
      count: (...args: unknown[]) => mockOrderItemCount(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

describe('computePaginationPages', () => {
  it('returns zero when limit is zero', () => {
    expect(computePaginationPages(10, 0)).toBe(0);
  });

  it('ceil-divides total by limit', () => {
    expect(computePaginationPages(21, 10)).toBe(3);
    expect(computePaginationPages(20, 10)).toBe(2);
  });
});

describe('GetCustomerPurchaseInfoService', () => {
  const service = new GetCustomerPurchaseInfoService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 when customer is missing', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(service.execute(99, {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Cliente não encontrado',
    });
  });

  it('returns zeros and empty recent lines when customer has no confirmed orders', async () => {
    mockFindFirst.mockResolvedValue({
      id: 1,
      name: 'Ana',
      city: 'São Paulo',
      state: 'SP',
    });
    mockOrderCount.mockResolvedValue(0);
    mockQueryRaw
      .mockResolvedValueOnce([{ total_units: 0, total_order_value: 0 }])
      .mockResolvedValueOnce([{ total_paid: 0 }])
      .mockResolvedValueOnce([]);
    mockOrderItemFindMany.mockResolvedValue([]);
    mockOrderItemCount.mockResolvedValue(0);

    const result = await service.execute(1, {});

    expect(result.customer.name).toBe('Ana');
    expect(result.stats).toEqual({
      order_count: 0,
      total_units: 0,
      total_order_value: 0,
      total_paid: 0,
    });
    expect(result.units_by_tcg).toEqual([]);
    expect(result.recent_lines.items).toEqual([]);
    expect(result.recent_lines.pagination).toEqual({ total: 0, pages: 0 });
  });

  it('maps aggregates, tcg breakdown and paginated recent lines', async () => {
    mockFindFirst.mockResolvedValue({
      id: 2,
      name: 'Bruno',
      city: null,
      state: null,
    });
    mockOrderCount.mockResolvedValue(2);
    mockQueryRaw
      .mockResolvedValueOnce([{ total_units: 15, total_order_value: '250.50' }])
      .mockResolvedValueOnce([{ total_paid: '180.00' }])
      .mockResolvedValueOnce([
        { tcg: 'one_piece', total_units: 10 },
        { tcg: 'pokemon', total_units: 5 },
      ]);
    mockOrderItemFindMany.mockResolvedValue([
      {
        quantity: 3,
        unit_price: '10.00',
        order: {
          id: 10,
          order_date: new Date('2026-05-01'),
          order_status: 'paid',
        },
        card: {
          id: 5,
          tcg: 'one_piece',
          card_type: 'leader',
          name: 'Luffy',
          edition: 'OP01',
          colors: ['red'],
        },
        card_print_model: {
          id: 1,
          name: 'Padrão',
          file_name: 'luffy.psd',
        },
      },
    ]);
    mockOrderItemCount.mockResolvedValue(12);

    const result = await service.execute(2, { offset: 0, limit: 10 });

    expect(result.stats).toEqual({
      order_count: 2,
      total_units: 15,
      total_order_value: 250.5,
      total_paid: 180,
    });
    expect(result.units_by_tcg).toEqual([
      { tcg: 'one_piece', total_units: 10 },
      { tcg: 'pokemon', total_units: 5 },
    ]);
    expect(result.recent_lines.items).toHaveLength(1);
    expect(result.recent_lines.items[0]).toMatchObject({
      order_id: 10,
      quantity: 3,
      unit_price: 10,
      line_total: 30,
      order_status: 'paid',
    });
    expect(result.recent_lines.pagination).toEqual({ total: 12, pages: 2 });

    expect(mockOrderItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        where: expect.objectContaining({
          order: expect.objectContaining({
            customer_id: 2,
            order_status: { not: 'quote' },
          }),
        }),
      })
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  countLinesWithoutPrintModel,
  countMissingPrintModelItems,
  countPendingProductionItems,
} from '../../../common/schemas/order.schema';

describe('countPendingProductionItems', () => {
  const items = [
    { production_shipment_id: null, fulfill_from_stock: false },
    { production_shipment_id: 1, fulfill_from_stock: false },
    { production_shipment_id: null, fulfill_from_stock: false },
    { production_shipment_id: null, fulfill_from_stock: true },
  ];

  it('counts pending only for production-eligible statuses', () => {
    expect(countPendingProductionItems('quote', items)).toBe(2);
    expect(countPendingProductionItems('partial_payment', items)).toBe(2);
    expect(countPendingProductionItems('paid', items)).toBe(2);
  });

  it('returns zero for statuses that skip production workflow', () => {
    expect(countPendingProductionItems('awaiting_payment', items)).toBe(0);
    expect(countPendingProductionItems('ready_for_delivery', items)).toBe(0);
    expect(countPendingProductionItems('delivered', items)).toBe(0);
  });

  it('excludes lines marked fulfill_from_stock', () => {
    const onlyStock = [
      { production_shipment_id: null, fulfill_from_stock: true },
      { production_shipment_id: null, fulfill_from_stock: true },
    ];
    expect(countPendingProductionItems('paid', onlyStock)).toBe(0);
  });
});

describe('countMissingPrintModelItems', () => {
  const items = [
    {
      production_shipment_id: null,
      fulfill_from_stock: false,
      card_print_model_id: null,
    },
    {
      production_shipment_id: null,
      fulfill_from_stock: false,
      card_print_model_id: 5,
    },
    {
      production_shipment_id: null,
      fulfill_from_stock: true,
      card_print_model_id: null,
    },
  ];

  it('counts only pending print lines without model', () => {
    expect(countMissingPrintModelItems('quote', items)).toBe(1);
    expect(countMissingPrintModelItems('paid', items)).toBe(1);
  });

  it('returns zero when order status is not production-eligible', () => {
    expect(countMissingPrintModelItems('ready_for_delivery', items)).toBe(0);
  });
});

describe('countLinesWithoutPrintModel', () => {
  const items = [
    { fulfill_from_stock: false, card_print_model_id: null },
    { fulfill_from_stock: false, card_print_model_id: 5 },
    { fulfill_from_stock: true, card_print_model_id: null },
    { fulfill_from_stock: false, card_print_model_id: null },
  ];

  it('counts non-stock lines without model regardless of order status', () => {
    expect(countLinesWithoutPrintModel(items)).toBe(2);
  });

  it('excludes fulfill_from_stock lines', () => {
    expect(
      countLinesWithoutPrintModel([
        { fulfill_from_stock: true, card_print_model_id: null },
      ])
    ).toBe(0);
  });
});

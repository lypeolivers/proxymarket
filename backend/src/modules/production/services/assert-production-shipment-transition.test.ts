import { describe, expect, it } from 'vitest';
import { assertProductionShipmentStatusTransition } from './assert-production-shipment-transition';

describe('assertProductionShipmentStatusTransition', () => {
  it('allows noop same status', () => {
    expect(() =>
      assertProductionShipmentStatusTransition('awaiting_print', 'awaiting_print')
    ).not.toThrow();
  });

  it('allows forward steps', () => {
    expect(() =>
      assertProductionShipmentStatusTransition('awaiting_print', 'printing')
    ).not.toThrow();
    expect(() => assertProductionShipmentStatusTransition('printing', 'printed')).not.toThrow();
  });

  it('rejects backwards', () => {
    expect(() => assertProductionShipmentStatusTransition('printing', 'awaiting_print')).toThrow();
    expect(() => assertProductionShipmentStatusTransition('printed', 'printing')).toThrow();
  });

  it('allows skipping to printed when already advancing forward', () => {
    expect(() =>
      assertProductionShipmentStatusTransition('awaiting_print', 'printed')
    ).not.toThrow();
  });
});

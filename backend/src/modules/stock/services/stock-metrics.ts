export type StockDemandFigures = {
  on_hand: number;
  demand_open: number;
  demand_quote: number;
};

export type StockComputedMetrics = {
  available_after_orders: number;
  need_to_produce: number;
};

export function computeStockMetrics(input: StockDemandFigures): StockComputedMetrics {
  const available_after_orders = input.on_hand - input.demand_open;
  const need_to_produce = Math.max(0, input.demand_open - input.on_hand);
  return { available_after_orders, need_to_produce };
}

export function computeGraphicNeed(on_hand: number, demand_pending_print: number): number {
  return Math.max(0, demand_pending_print - on_hand);
}

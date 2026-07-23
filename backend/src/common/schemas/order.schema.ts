import { z } from 'zod';

export const OrderPipelineStatus = z.enum([
  'quote',
  'partial_payment',
  'paid',
  'awaiting_payment',
  'ready_for_delivery',
  'delivered',
]);

export type TOrderPipelineStatus = z.infer<typeof OrderPipelineStatus>;

export const ORDER_PIPELINE_ORDER: TOrderPipelineStatus[] = [
  'quote',
  'partial_payment',
  'paid',
  'awaiting_payment',
  'ready_for_delivery',
  'delivered',
];

/** Pedidos nestes status podem usar estoque / não exigem fila da gráfica na UI. */
export const ORDER_STATUSES_PRODUCTION_ELIGIBLE: TOrderPipelineStatus[] = [
  'quote',
  'partial_payment',
  'paid',
];

export function isOrderProductionEligible(status: TOrderPipelineStatus): boolean {
  return ORDER_STATUSES_PRODUCTION_ELIGIBLE.includes(status);
}

export type TOrderLineProductionFields = {
  production_shipment_id: number | null;
  fulfill_from_stock: boolean;
};

export function isLinePendingProduction(item: TOrderLineProductionFields): boolean {
  return item.production_shipment_id == null && !item.fulfill_from_stock;
}

export function countPendingProductionItems(
  orderStatus: TOrderPipelineStatus,
  items: Array<TOrderLineProductionFields>
): number {
  if (!isOrderProductionEligible(orderStatus)) {
    return 0;
  }
  return items.filter(isLinePendingProduction).length;
}

export type TOrderLinePrintModelFields = TOrderLineProductionFields & {
  card_print_model_id: number | null;
};

export function countMissingPrintModelItems(
  orderStatus: TOrderPipelineStatus,
  items: Array<TOrderLinePrintModelFields>
): number {
  if (!isOrderProductionEligible(orderStatus)) {
    return 0;
  }
  return items.filter(
    (item) => isLinePendingProduction(item) && item.card_print_model_id == null
  ).length;
}

export function countLinesWithoutPrintModel(
  items: Array<{ card_print_model_id: number | null; fulfill_from_stock: boolean }>
): number {
  return items.filter(
    (item) => !item.fulfill_from_stock && item.card_print_model_id == null
  ).length;
}

export const DeliveryMethod = z.enum(['postal', 'hand_delivery']);

export type TDeliveryMethod = z.infer<typeof DeliveryMethod>;

/** Default when marking an order as delivered without an explicit delivery method. */
export const DEFAULT_DELIVERY_METHOD: TDeliveryMethod = 'postal';

export const OrderLineArtStatus = z.enum([
  'art_to_do',
  'art_ready',
  'confirmed',
  'printing',
  'printed',
]);

export const MoneyAmount = z.coerce
  .number()
  .nonnegative('O valor não pode ser negativo.')
  .refine((value) => Number.isFinite(value), 'Informe um valor válido.')
  .refine(
    (value) => Math.round(value * 100) === value * 100,
    'Use no máximo duas casas decimais.'
  );

export const OrderItemInput = z.object({
  card_id: z.coerce.number().int().positive(),
  card_print_model_id: z
    .union([z.coerce.number().int().positive(), z.null(), z.literal('')])
    .transform((value) => (value === '' || value == null ? null : value)),
  customer_gift_id: z
    .union([z.coerce.number().int().positive(), z.null(), z.literal('')])
    .transform((value) => (value === '' || value == null ? null : value))
    .optional(),
  fulfill_from_stock: z.coerce.boolean().optional().default(false),
  quantity: z.coerce.number().int().min(1, 'A quantidade mínima é 1.'),
  unit_price: MoneyAmount,
});

export type TOrderItemInput = z.infer<typeof OrderItemInput>;

/** Data comercial (YYYY-MM-DD) → instante ao meio-dia UTC (compatível com @db.Date no Postgres). */
export const OrderDateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data no formato AAAA-MM-DD.')
  .transform((s) => new Date(`${s}T12:00:00.000Z`));

export type TOrderDateInput = z.infer<typeof OrderDateInput>;

export type TOrderLineArtStatus = z.infer<typeof OrderLineArtStatus>;

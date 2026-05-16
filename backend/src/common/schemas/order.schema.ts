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

export const DeliveryMethod = z.enum(['postal', 'hand_delivery']);

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
  quantity: z.coerce.number().int().min(1, 'A quantidade mínima é 1.'),
  unit_price: MoneyAmount,
  art_status: OrderLineArtStatus.optional(),
});

export type TOrderItemInput = z.infer<typeof OrderItemInput>;

/** Data comercial (YYYY-MM-DD) → instante ao meio-dia UTC (compatível com @db.Date no Postgres). */
export const OrderDateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data no formato AAAA-MM-DD.')
  .transform((s) => new Date(`${s}T12:00:00.000Z`));

export type TOrderDateInput = z.infer<typeof OrderDateInput>;

export type TDeliveryMethod = z.infer<typeof DeliveryMethod>;
export type TOrderLineArtStatus = z.infer<typeof OrderLineArtStatus>;

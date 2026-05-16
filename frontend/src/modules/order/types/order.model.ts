import { z } from 'zod'

import { CardColor, CardType, Tcg } from '@/modules/card/types/card.model'

export const OrderPipelineStatus = z.enum([
  'quote',
  'partial_payment',
  'paid',
  'awaiting_payment',
  'ready_for_delivery',
  'delivered',
])
export type TOrderPipelineStatus = z.infer<typeof OrderPipelineStatus>

export const ORDER_PIPELINE_ORDER: TOrderPipelineStatus[] = [
  'quote',
  'partial_payment',
  'paid',
  'awaiting_payment',
  'ready_for_delivery',
  'delivered',
]

export const DeliveryMethod = z.enum(['postal', 'hand_delivery'])
export type TDeliveryMethod = z.infer<typeof DeliveryMethod>

export const OrderLineArtStatus = z.enum([
  'art_to_do',
  'art_ready',
  'confirmed',
  'printing',
  'printed',
])
export type TOrderLineArtStatus = z.infer<typeof OrderLineArtStatus>

export const OrderCardSnapshot = z.object({
  id: z.number(),
  tcg: Tcg,
  card_type: CardType,
  name: z.string().nullable(),
  edition: z.string().nullable(),
  colors: z.array(CardColor),
})

export const OrderCustomerSummary = z.object({
  id: z.number(),
  name: z.string(),
})

export const OrderItem = z.object({
  id: z.number(),
  card_id: z.number(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
})

export const Order = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer: OrderCustomerSummary,
  order_status: OrderPipelineStatus,
  delivery_method: DeliveryMethod.nullable(),
  notes: z.string().nullable(),
  order_date: z.coerce.date(),
  total_amount: z.number(),
  items: z.array(OrderItem),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TOrder = z.infer<typeof Order>

export const OrderSummaryLine = z.object({
  id: z.number(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
})

export type TOrderSummaryLine = z.infer<typeof OrderSummaryLine>

export const OrderSummary = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer_name: z.string(),
  order_status: OrderPipelineStatus,
  delivery_method: DeliveryMethod.nullable(),
  notes: z.string().nullable(),
  order_date: z.coerce.date(),
  total_amount: z.number(),
  item_count: z.number(),
  lines: z.array(OrderSummaryLine),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TOrderSummary = z.infer<typeof OrderSummary>

const OrderItemBody = z.object({
  card_id: z.number().int().positive(),
  quantity: z.number().int().min(1),
  unit_price: z.number().nonnegative(),
  art_status: OrderLineArtStatus.optional(),
})

export const OrderBody = z.object({
  customer_id: z.number().int().positive(),
  order_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a data no formato AAAA-MM-DD.'),
  order_status: OrderPipelineStatus.optional(),
  delivery_method: DeliveryMethod.nullable().optional(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(OrderItemBody).min(1),
})

export type TOrderBody = z.infer<typeof OrderBody>

export const PatchOrderBody = z.object({
  order_status: OrderPipelineStatus.optional(),
  order_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  delivery_method: DeliveryMethod.nullable().optional(),
  notes: z.string().trim().optional().nullable(),
})

export type TPatchOrderBody = z.infer<typeof PatchOrderBody>

export const PatchOrderItemBody = z.object({
  art_status: OrderLineArtStatus.optional(),
  quantity: z.number().int().min(1).optional(),
  unit_price: z.number().nonnegative().optional(),
})

export type TPatchOrderItemBody = z.infer<typeof PatchOrderItemBody>

export const ListOrdersResponse = z.object({
  items: z.array(OrderSummary),
  pagination: z.object({
    total: z.number(),
    pages: z.number(),
  }),
})

export type TListOrdersResponse = z.infer<typeof ListOrdersResponse>

export const OrderStats = z.object({
  quotes_count: z.number(),
  in_progress_count: z.number(),
  ready_for_delivery_count: z.number(),
  delivered_count: z.number(),
  revenue_month: z.number(),
  pipeline_value: z.number(),
  items_by_art_status: z.object({
    art_to_do: z.number(),
    art_ready: z.number(),
    confirmed: z.number(),
    printing: z.number(),
    printed: z.number(),
  }),
  active_cards_count: z.number(),
  insights: z.object({
    top_customer_by_revenue: z
      .object({
        customer_id: z.number(),
        name: z.string(),
        total_revenue: z.number(),
      })
      .nullable(),
    top_card_by_quantity: z
      .object({
        card_id: z.number(),
        tcg: z.string(),
        card_type: z.string(),
        name: z.string().nullable(),
        edition: z.string().nullable(),
        total_quantity: z.number(),
      })
      .nullable(),
    top_customer_by_units: z
      .object({
        customer_id: z.number(),
        name: z.string(),
        total_units: z.number(),
      })
      .nullable(),
  }),
  revenue_by_month: z.array(
    z.object({
      month: z.string(),
      revenue: z.number(),
    }),
  ),
})

export type TOrderStats = z.infer<typeof OrderStats>

export const ORDER_STATUS_LABELS: Record<TOrderPipelineStatus, string> = {
  quote: 'Orçamento',
  partial_payment: 'Pagamento parcial',
  paid: 'Pago',
  awaiting_payment: 'Aguardando pagamento',
  ready_for_delivery: 'Pronto para a entrega',
  delivered: 'Entregue',
}

/** Statuses allowed when moving forward in the pipeline (excludes current and past). */
export function forwardPipelineStatuses(from: TOrderPipelineStatus): TOrderPipelineStatus[] {
  if (from === 'delivered') return []
  const idx = ORDER_PIPELINE_ORDER.indexOf(from)
  return ORDER_PIPELINE_ORDER.slice(idx + 1)
}

export const ORDER_STATUS_OPTIONS: TOrderPipelineStatus[] = [...ORDER_PIPELINE_ORDER]

export const DELIVERY_METHOD_LABELS: Record<TDeliveryMethod, string> = {
  postal: 'Correios',
  hand_delivery: 'Entrega pessoal',
}

export const ART_STATUS_LABELS: Record<TOrderLineArtStatus, string> = {
  art_to_do: 'Arte a fazer',
  art_ready: 'Arte pronta',
  confirmed: 'Confirmado',
  printing: 'Em impressão',
  printed: 'Impresso',
}

export const DELIVERY_OPTIONS: TDeliveryMethod[] = ['postal', 'hand_delivery']
export const ART_STATUS_OPTIONS: TOrderLineArtStatus[] = [
  'art_to_do',
  'art_ready',
  'confirmed',
  'printing',
  'printed',
]

export function orderStatusChipClass(status: TOrderPipelineStatus): string {
  switch (status) {
    case 'quote':
      return 'border border-border bg-muted/40 text-foreground'
    case 'partial_payment':
      return 'border border-amber-500/35 bg-amber-500/15 text-amber-950 dark:text-amber-100'
    case 'paid':
      return 'border border-primary/40 bg-primary/12 text-foreground'
    case 'awaiting_payment':
      return 'border border-orange-500/35 bg-orange-500/12 text-foreground'
    case 'ready_for_delivery':
      return 'border border-sky-500/35 bg-sky-500/10 text-foreground'
    case 'delivered':
      return 'border border-emerald-600/40 bg-emerald-600/12 text-foreground'
    default:
      return 'border border-border bg-muted/40'
  }
}

export function orderStatusCardAccent(status: TOrderPipelineStatus): string {
  switch (status) {
    case 'quote':
      return 'border-l-4 border-l-muted-foreground/45 bg-muted/20'
    case 'partial_payment':
      return 'border-l-4 border-l-amber-500/85 bg-amber-500/[0.09]'
    case 'paid':
      return 'border-l-4 border-l-primary bg-primary/[0.07]'
    case 'awaiting_payment':
      return 'border-l-4 border-l-orange-500/80 bg-orange-500/[0.08]'
    case 'ready_for_delivery':
      return 'border-l-4 border-l-sky-500/80 bg-sky-500/[0.08]'
    case 'delivered':
      return 'border-l-4 border-l-emerald-600/85 bg-emerald-600/[0.08]'
    default:
      return ''
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function computeLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

export function computeOrderTotal(
  items: Array<{ quantity: number; unit_price: number }>,
): number {
  return Math.round(
    items.reduce((sum, item) => sum + computeLineTotal(item.quantity, item.unit_price), 0) *
      100,
  ) / 100
}

/** Forma de envio só faz sentido após sair do orçamento; obrigatório ao entregar. */
export function showDeliveryField(orderStatus: TOrderPipelineStatus): boolean {
  return orderStatus === 'ready_for_delivery' || orderStatus === 'delivered'
}

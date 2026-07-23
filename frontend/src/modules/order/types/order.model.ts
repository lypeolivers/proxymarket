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

/** Default when marking an order as delivered without an explicit delivery method. */
export const DEFAULT_DELIVERY_METHOD: TDeliveryMethod = 'postal'

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
  state: z.string().nullable(),
})

export const OrderPayment = z.object({
  id: z.number(),
  amount: z.number(),
  collected_at: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
})

export type TOrderPayment = z.infer<typeof OrderPayment>

export const OrderPrintModelSnapshot = z.object({
  id: z.number(),
  name: z.string(),
  file_name: z.string(),
})

export const OrderItem = z.object({
  id: z.number(),
  card_id: z.number(),
  card_print_model_id: z.number().nullable(),
  customer_gift_id: z.number().nullable(),
  fulfill_from_stock: z.boolean(),
  production_shipment_id: z.number().nullable(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot.nullable(),
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
  amount_paid: z.number(),
  amount_due: z.number(),
  is_fully_paid: z.boolean(),
  payments: z.array(OrderPayment),
  items: z.array(OrderItem),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TOrder = z.infer<typeof Order>

export const OrderSummaryLine = z.object({
  id: z.number(),
  card_print_model_id: z.number().nullable(),
  customer_gift_id: z.number().nullable(),
  fulfill_from_stock: z.boolean(),
  quantity: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
  art_status: OrderLineArtStatus,
  card: OrderCardSnapshot,
  card_print_model: OrderPrintModelSnapshot.nullable(),
})

export type TOrderSummaryLine = z.infer<typeof OrderSummaryLine>

export const OrderSummary = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer_name: z.string(),
  customer_state: z.string().nullable(),
  order_status: OrderPipelineStatus,
  delivery_method: DeliveryMethod.nullable(),
  notes: z.string().nullable(),
  order_date: z.coerce.date(),
  total_amount: z.number(),
  amount_paid: z.number(),
  amount_due: z.number(),
  is_fully_paid: z.boolean(),
  item_count: z.number(),
  pending_production_count: z.number(),
  missing_print_model_count: z.number(),
  lines_without_model_count: z.number(),
  lines: z.array(OrderSummaryLine),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
})

export type TOrderSummary = z.infer<typeof OrderSummary>

const OrderItemBody = z.object({
  card_id: z.number().int().positive(),
  card_print_model_id: z.number().int().positive().nullable(),
  customer_gift_id: z.number().int().positive().nullable().optional(),
  fulfill_from_stock: z.boolean().optional().default(false),
  quantity: z.number().int().min(1),
  unit_price: z.number().nonnegative(),
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
  quantity: z.number().int().min(1).optional(),
  unit_price: z.number().nonnegative().optional(),
}).refine((d) => d.quantity !== undefined || d.unit_price !== undefined, {
  message: 'Informe ao menos um campo.',
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
  in_progress_by_status: z.object({
    partial_payment: z.number(),
    paid: z.number(),
    awaiting_payment: z.number(),
  }),
  ready_for_delivery_count: z.number(),
  delivered_count: z.number(),
  revenue_month: z.number(),
  pipeline_value: z.number(),
  amount_due_total: z.number(),
  orders_with_balance_count: z.number(),
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
  confirmed_revenue_by_month: z.array(
    z.object({
      month: z.string(),
      revenue: z.number(),
    }),
  ),
  operations: z.object({
    graphic_total_units: z.number(),
    print_backlog_order_count: z.number(),
    pending_production_lines: z.number(),
    missing_print_model_lines: z.number(),
    open_shipment: z
      .object({
        id: z.number(),
        display_number: z.number(),
        line_count: z.number(),
        total_units: z.number(),
      })
      .nullable(),
  }),
})

export type TOrderStats = z.infer<typeof OrderStats>

export const GetOrderStatsParams = z.object({
  period_months: z.union([z.literal(3), z.literal(6), z.literal(12)]).optional(),
  tcg: z.enum(['one_piece', 'magic', 'pokemon']).optional(),
  customer_state: z
    .enum([
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
      'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ])
    .optional(),
})

export type TGetOrderStatsParams = z.infer<typeof GetOrderStatsParams>

export const ORDER_STATUS_LABELS: Record<TOrderPipelineStatus, string> = {
  quote: 'Orçamento',
  partial_payment: 'Pagamento parcial',
  paid: 'Pago',
  awaiting_payment: 'Aguardando pagamento',
  ready_for_delivery: 'Pronto para a entrega',
  delivered: 'Entregue',
}

/** All pipeline statuses except the current one (for status picker menus). */
export function pipelineStatusesExcept(current: TOrderPipelineStatus): TOrderPipelineStatus[] {
  return ORDER_PIPELINE_ORDER.filter((status) => status !== current)
}

export const ORDER_STATUS_OPTIONS: TOrderPipelineStatus[] = [...ORDER_PIPELINE_ORDER]

/** Orçamento e pagamento em curso — ainda pode precisar de impressão na gráfica. */
export const ORDER_STATUSES_PRODUCTION_ELIGIBLE: TOrderPipelineStatus[] = [
  'quote',
  'partial_payment',
  'paid',
]

export function isOrderProductionEligible(status: TOrderPipelineStatus): boolean {
  return ORDER_STATUSES_PRODUCTION_ELIGIBLE.includes(status)
}

/** Contagem da API só é relevante para exibir alerta/envio nestes status. */
export function effectivePendingProductionCount(order: {
  order_status: TOrderPipelineStatus
  pending_production_count: number
}): number {
  return isOrderProductionEligible(order.order_status) ? order.pending_production_count : 0
}

export function effectiveMissingPrintModelCount(order: {
  order_status: TOrderPipelineStatus
  missing_print_model_count: number
}): number {
  return isOrderProductionEligible(order.order_status) ? order.missing_print_model_count : 0
}

/** Linhas sem modelo de impressão (badge visual; qualquer status; exclui estoque). */
export function orderLinesWithoutModelCount(order: {
  lines_without_model_count: number
}): number {
  return order.lines_without_model_count
}

export const PrintBacklogItem = z.object({
  order_id: z.number(),
  customer_name: z.string(),
  order_status: OrderPipelineStatus,
  pending_print_lines: z.number(),
  missing_model_lines: z.number(),
  total_units: z.number(),
})

export const PrintBacklogResponse = z.object({
  items: z.array(PrintBacklogItem),
})

export type TPrintBacklogItem = z.infer<typeof PrintBacklogItem>
export type TPrintBacklogResponse = z.infer<typeof PrintBacklogResponse>

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

/** Resolves delivery method for a pipeline status (Correios by default when delivered). */
export function deliveryMethodForOrderStatus(
  orderStatus: TOrderPipelineStatus,
  current: TDeliveryMethod | null,
): TDeliveryMethod | null {
  if (orderStatus === 'quote') return null
  if (orderStatus === 'delivered') return current ?? DEFAULT_DELIVERY_METHOD
  return current
}

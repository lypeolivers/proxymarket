import type { TCard } from '@/modules/card/types/card.model'
import { CARD_TYPE_LABELS, TCG_LABELS } from '@/modules/card/types/card.model'
import {
  ART_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  formatCurrency,
  type TOrderSummary,
} from '@/modules/order/types/order.model'

/** Label for a card line in order summary (shared with list / viewer / clipboard). */
export function formatOrderLineCardLabel(
  snapshot: Pick<TCard, 'tcg' | 'card_type' | 'name' | 'edition'>,
): string {
  const tcg = TCG_LABELS[snapshot.tcg]
  const type = CARD_TYPE_LABELS[snapshot.card_type]
  const name = snapshot.name?.trim()
  const edition = snapshot.edition?.trim()
  const parts = [tcg, type]
  if (name) parts.push(name)
  if (edition) parts.push(`(${edition})`)
  return parts.join(' · ')
}

export function formatOrderSummaryDateShort(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value)
}

/** Plain-text summary for clipboard / export. */
export function buildOrderSummaryClipboardText(order: TOrderSummary): string {
  const statusLabel = ORDER_STATUS_LABELS[order.order_status]
  const delivery =
    order.delivery_method != null ? DELIVERY_METHOD_LABELS[order.delivery_method] : '—'
  const linesBlock =
    order.lines.length > 0
      ? order.lines
          .map(
            (line) =>
              `• ${line.quantity} × ${formatOrderLineCardLabel(line.card)} — ${formatCurrency(line.line_total)} — modelo ${line.card_print_model.name} (${line.card_print_model.file_name}) — ${ART_STATUS_LABELS[line.art_status]}`,
          )
          .join('\n')
      : '(sem linhas)'

  const parts = [
    `Cliente: ${order.customer_name}`,
    `Status: ${statusLabel}`,
    `Data do pedido: ${formatOrderSummaryDateShort(order.order_date)}`,
    ...(order.order_status === 'ready_for_delivery' || order.order_status === 'delivered'
      ? [`Forma de envio: ${delivery}`]
      : []),
    `Total: ${formatCurrency(order.total_amount)}`,
    `Criado no sistema: ${formatOrderSummaryDateShort(order.created_at)}`,
    `Atualizado: ${formatOrderSummaryDateShort(order.updated_at ?? order.created_at)}`,
  ]
  if (order.notes?.trim()) {
    parts.push(`Observações: ${order.notes.trim()}`)
  }
  parts.push('', 'Itens:', linesBlock)
  return parts.join('\n')
}

import { useEffect, useState } from 'react'
import { Copy, Pencil } from 'lucide-react'

import { CardColorDots } from '@/components/CardColorDots'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  buildOrderSummaryClipboardText,
  formatOrderLineCardLabel,
  formatOrderSummaryDateShort,
} from '@/modules/order/lib/order-summary-text'
import {
  ART_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  formatCurrency,
  type TOrderLineArtStatus,
  type TOrderSummary,
} from '@/modules/order/types/order.model'

function lineArtAccent(art: TOrderLineArtStatus): string {
  switch (art) {
    case 'art_to_do':
      return 'border-l-muted-foreground/55'
    case 'art_ready':
      return 'border-l-sky-400/85'
    case 'confirmed':
      return 'border-l-amber-400/85'
    case 'printing':
      return 'border-l-violet-400/80'
    case 'printed':
      return 'border-l-primary'
    default:
      return 'border-l-border'
  }
}

export type OrderDetailDialogProps = {
  open: boolean
  order: TOrderSummary | null
  onOpenChange: (open: boolean) => void
  onEdit?: (order: TOrderSummary) => void
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-4 sm:items-start">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm leading-snug text-foreground">{children}</span>
    </div>
  )
}

export function OrderDetailDialog({ open, order, onOpenChange, onEdit }: OrderDetailDialogProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function handleCopy() {
    if (!order) return
    const text = buildOrderSummaryClipboardText(order)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copie o texto:', text)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,56rem)] max-w-xl sm:max-w-2xl">
        {order ? (
          <>
            <DialogHeader>
              <DialogTitle>Pedido #{order.id}</DialogTitle>
              <DialogDescription>
                {order.customer_name} — {formatCurrency(order.total_amount)}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <dl className="space-y-3">
                <DetailItem label="Cliente">{order.customer_name}</DetailItem>
                <DetailItem label="Status">{ORDER_STATUS_LABELS[order.order_status]}</DetailItem>
                {order.order_status === 'ready_for_delivery' || order.order_status === 'delivered' ? (
                  <DetailItem label="Forma de envio">
                    {order.delivery_method != null
                      ? DELIVERY_METHOD_LABELS[order.delivery_method]
                      : '—'}
                  </DetailItem>
                ) : null}
                <DetailItem label="Total">{formatCurrency(order.total_amount)}</DetailItem>
                <DetailItem label="Data do pedido">
                  {formatOrderSummaryDateShort(order.order_date)}
                </DetailItem>
                <DetailItem label="Criado">
                  {formatOrderSummaryDateShort(order.created_at)}
                </DetailItem>
                <DetailItem label="Atualizado">
                  {formatOrderSummaryDateShort(order.updated_at ?? order.created_at)}
                </DetailItem>
              </dl>

              {order.notes?.trim() ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Observações
                    </p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                      {order.notes.trim()}
                    </p>
                  </div>
                </>
              ) : null}

              <Separator />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Itens</p>
                <ul className="mt-2 space-y-2">
                  {order.lines.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Nenhum item.</li>
                  ) : (
                    order.lines.map((line) => (
                      <li
                        key={line.id}
                        className={cn(
                          'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-border/50 bg-muted/15 px-3 py-2 text-sm',
                          'border-l-4',
                          lineArtAccent(line.art_status),
                        )}
                      >
                        <CardColorDots colors={line.card.colors} className="shrink-0" />
                        <span className="min-w-0 flex-1 font-medium leading-snug">
                          {formatOrderLineCardLabel(line.card)}
                        </span>
                        <span className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
                          {line.card_print_model.name} · {line.card_print_model.file_name}
                        </span>
                        <span className="text-muted-foreground">
                          {line.quantity} × {formatCurrency(line.unit_price)}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatCurrency(line.line_total)}
                        </span>
                        <span className="text-xs font-medium">{ART_STATUS_LABELS[line.art_status]}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="outline" className="gap-1" onClick={() => void handleCopy()}>
                <Copy className="size-3.5" aria-hidden />
                {copied ? 'Copiado' : 'Copiar resumo'}
              </Button>
              <div className="ml-auto flex flex-wrap gap-2">
                {onEdit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-1"
                    onClick={() => {
                      onEdit(order)
                      onOpenChange(false)
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Editar
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ApiError from '@/lib/api-error'
import {
  OrderPaymentsSection,
  type PaymentSummaryPatch,
} from '@/modules/order/components/order-payments-section'
import { getOrderService } from '@/modules/order/services/get-order.service'
import {
  ORDER_STATUS_LABELS,
  formatCurrency,
  type TOrder,
  type TOrderSummary,
} from '@/modules/order/types/order.model'

export type OrderPaymentsDialogProps = {
  open: boolean
  order: TOrderSummary | null
  onOpenChange: (open: boolean) => void
  onPaymentsUpdated?: (orderId: number, summary: PaymentSummaryPatch) => void
}

export function OrderPaymentsDialog({
  open,
  order,
  onOpenChange,
  onPaymentsUpdated,
}: OrderPaymentsDialogProps) {
  const [fullOrder, setFullOrder] = useState<TOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadOrder = useCallback(async (orderId: number) => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getOrderService(orderId)
      setFullOrder(data)
    } catch (err) {
      setFullOrder(null)
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar os pagamentos do pedido.'
      setLoadError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !order) {
      setFullOrder(null)
      setLoadError(null)
      return
    }
    void loadOrder(order.id)
  }, [open, order, loadOrder])

  function handlePaymentsChange(
    payments: TOrder['payments'],
    summary: PaymentSummaryPatch,
  ) {
    if (!order) return
    setFullOrder((prev) =>
      prev
        ? {
            ...prev,
            payments,
            ...summary,
          }
        : null,
    )
    onPaymentsUpdated?.(order.id, summary)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,40rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagamentos do pedido #{order?.id ?? '—'}</DialogTitle>
          <DialogDescription>
            {order ? (
              <>
                {order.customer_name}
                {order.customer_state ? ` (${order.customer_state})` : ''}
                {' · '}
                {ORDER_STATUS_LABELS[order.order_status]}
                {' · '}
                Total {formatCurrency(order.total_amount)}
              </>
            ) : (
              'Registre valores recebidos com data de recolhimento.'
            )}
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando pagamentos…
          </div>
        ) : fullOrder && order ? (
          <OrderPaymentsSection
            key={order.id}
            orderId={order.id}
            summary={{
              total_amount: fullOrder.total_amount,
              amount_paid: fullOrder.amount_paid,
              amount_due: fullOrder.amount_due,
              is_fully_paid: fullOrder.is_fully_paid,
              payments: fullOrder.payments,
            }}
            onPaymentsChange={handlePaymentsChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

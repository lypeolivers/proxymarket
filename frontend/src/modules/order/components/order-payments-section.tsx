import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ApiError from '@/lib/api-error'
import { createOrderPaymentService } from '@/modules/order/services/create-order-payment.service'
import { deleteOrderPaymentService } from '@/modules/order/services/delete-order-payment.service'
import {
  formatCurrency,
  type TOrder,
  type TOrderPayment,
} from '@/modules/order/types/order.model'

function todayLocalIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatCollectedDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value)
}

type OrderPaymentsSectionProps = {
  orderId: number
  summary: Pick<
    TOrder,
    'total_amount' | 'amount_paid' | 'amount_due' | 'is_fully_paid' | 'payments'
  >
  readOnly?: boolean
  onPaymentsChange: (payments: TOrderPayment[], summary: PaymentSummaryPatch) => void
}

export type PaymentSummaryPatch = {
  amount_paid: number
  amount_due: number
  is_fully_paid: boolean
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function recomputeSummary(
  total: number,
  payments: TOrderPayment[],
): PaymentSummaryPatch {
  const paid = roundMoney(payments.reduce((s, p) => s + p.amount, 0))
  const due = roundMoney(Math.max(0, total - paid))
  return {
    amount_paid: paid,
    amount_due: due,
    is_fully_paid: paid >= roundMoney(total) && total > 0,
  }
}

export function OrderPaymentsSection({
  orderId,
  summary,
  readOnly = false,
  onPaymentsChange,
}: OrderPaymentsSectionProps) {
  const [payments, setPayments] = useState(summary.payments)
  useEffect(() => {
    setPayments(summary.payments)
  }, [summary.payments])

  const [amountInput, setAmountInput] = useState('')
  const [collectedAt, setCollectedAt] = useState(todayLocalIsoDate())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const paymentSummary = recomputeSummary(summary.total_amount, payments)

  async function handleAddPayment() {
    const amount = Number(amountInput.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido maior que zero.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const created = await createOrderPaymentService(orderId, {
        amount,
        collected_at: collectedAt,
        notes: notes.trim() || null,
      })
      const next = [created, ...payments]
      setPayments(next)
      onPaymentsChange(next, recomputeSummary(summary.total_amount, next))
      setAmountInput('')
      setNotes('')
      setCollectedAt(todayLocalIsoDate())
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível registrar o pagamento.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(paymentId: number) {
    setDeletingId(paymentId)
    setError(null)
    try {
      await deleteOrderPaymentService(orderId, paymentId)
      const next = payments.filter((p) => p.id !== paymentId)
      setPayments(next)
      onPaymentsChange(next, recomputeSummary(summary.total_amount, next))
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível remover o pagamento.'
      setError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Pagamentos</p>
        {paymentSummary.is_fully_paid ? (
          <span className="rounded-md bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            100% recebido
          </span>
        ) : null}
      </div>

      <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Total do pedido</p>
          <p className="font-semibold tabular-nums">{formatCurrency(summary.total_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Já recebido</p>
          <p className="font-semibold tabular-nums">{formatCurrency(paymentSummary.amount_paid)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo em aberto</p>
          <p className="font-semibold tabular-nums">{formatCurrency(paymentSummary.amount_due)}</p>
        </div>
      </div>

      {payments.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-background/40 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium tabular-nums">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  Recolhido em {formatCollectedDate(payment.collected_at)}
                  {payment.notes?.trim() ? ` · ${payment.notes.trim()}` : ''}
                </p>
              </div>
              {!readOnly ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={deletingId === payment.id}
                  aria-label="Remover pagamento"
                  onClick={() => void handleRemove(payment.id)}
                >
                  {deletingId === payment.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
      )}

      {!readOnly ? (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Valor recebido</Label>
              <Input
                id="payment-amount"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                disabled={submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-collected-at">Data de recolhimento</Label>
              <Input
                id="payment-collected-at"
                type="date"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-notes">Observação (opcional)</Label>
            <Input
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={() => void handleAddPayment()}
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Registrando…
              </>
            ) : (
              'Registrar pagamento'
            )}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

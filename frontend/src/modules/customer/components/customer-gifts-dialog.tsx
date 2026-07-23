import { useCallback, useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ApiError from '@/lib/api-error'
import {
  createCustomerGiftService,
  deleteCustomerGiftService,
  listCustomerGiftsService,
} from '@/modules/customer/services/customer-gift.service'
import type { TCustomer, TCustomerGift } from '@/modules/customer/types/customer.model'

export type CustomerGiftsDialogProps = {
  open: boolean
  customer: TCustomer | null
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}

function formatDt(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(value)
}

export function CustomerGiftsDialog({
  open,
  customer,
  onOpenChange,
  onChanged,
}: CustomerGiftsDialogProps) {
  const [items, setItems] = useState<TCustomerGift[]>([])
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  const load = useCallback(async (customerId: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listCustomerGiftsService(customerId)
      setItems(data.items)
      setRemaining(data.gift_units_remaining)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar os brindes.'
      setError(msg)
      setItems([])
      setRemaining(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || customer == null) {
      setItems([])
      setRemaining(0)
      setError(null)
      setQuantity('1')
      setNotes('')
      return
    }
    void load(customer.id)
  }, [open, customer, load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!customer) return

    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty < 1) {
      setError('Informe uma quantidade válida (mínimo 1).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createCustomerGiftService(customer.id, {
        quantity: qty,
        notes: notes.trim() || null,
      })
      setQuantity('1')
      setNotes('')
      await load(customer.id)
      onChanged?.()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível conceder o brinde.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(gift: TCustomerGift) {
    if (!customer) return
    if (gift.quantity_used > 0) return
    if (!window.confirm('Remover este brinde?')) return

    setDeletingId(gift.id)
    setError(null)
    try {
      await deleteCustomerGiftService(customer.id, gift.id)
      await load(customer.id)
      onChanged?.()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível remover o brinde.'
      setError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,56rem)] max-w-xl overflow-y-auto">
        {customer ? (
          <>
            <DialogHeader>
              <DialogTitle>Brindes</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {customer.name} — {remaining} carta{remaining === 1 ? '' : 's'} de brinde
                disponível{remaining === 1 ? '' : 'is'}
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <p
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <form className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3" onSubmit={(e) => void handleCreate(e)}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Conceder brinde
              </p>
              <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <div className="grid gap-1.5">
                  <Label htmlFor="gift-quantity">Quantidade</Label>
                  <Input
                    id="gift-quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="gift-notes">Observação</Label>
                  <Input
                    id="gift-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex.: promoção de aniversário"
                    disabled={submitting}
                  />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="size-3.5 animate-spin" /> : 'Conceder brinde'}
              </Button>
            </form>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Histórico de concessões
              </p>
              {loading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando…
                </div>
              ) : items.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">Nenhum brinde registrado.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Data</th>
                        <th className="py-2 pr-3 text-right font-medium">Concedido</th>
                        <th className="py-2 pr-3 text-right font-medium">Usado</th>
                        <th className="py-2 pr-3 text-right font-medium">Restante</th>
                        <th className="py-2 pr-3 font-medium">Obs.</th>
                        <th className="py-2 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((gift) => (
                        <tr key={gift.id} className="border-b border-border/40 last:border-0">
                          <td className="py-2 pr-3 text-muted-foreground">
                            {formatDt(gift.created_at)}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {gift.quantity_granted}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {gift.quantity_used}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {gift.quantity_remaining}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">
                            {gift.notes?.trim() || '—'}
                          </td>
                          <td className="py-2 text-right">
                            {gift.quantity_used === 0 ? (
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                aria-label="Remover brinde"
                                className="hover:text-destructive"
                                disabled={deletingId === gift.id}
                                onClick={() => void handleDelete(gift)}
                              >
                                {deletingId === gift.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border/60 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import ApiError from '@/lib/api-error'
import { BRAZIL_UF_EXTENDED_LABELS } from '@/lib/brazil-regions'
import { TCG_LABELS } from '@/modules/card/types/card.model'
import { getCustomerPurchaseInfoService } from '@/modules/customer/services/get-customer-purchase-info.service'
import type { TCustomer, TCustomerPurchaseInfoResponse } from '@/modules/customer/types/customer.model'
import {
  formatOrderLineCardLabel,
  formatOrderSummaryDateShort,
} from '@/modules/order/lib/order-summary-text'
import { ORDER_STATUS_LABELS, formatCurrency } from '@/modules/order/types/order.model'

const PAGE_SIZE = 10

export type CustomerPurchaseInfoDialogProps = {
  open: boolean
  customer: TCustomer | null
  onOpenChange: (open: boolean) => void
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function CustomerPurchaseInfoDialog({
  open,
  customer,
  onOpenChange,
}: CustomerPurchaseInfoDialogProps) {
  const [data, setData] = useState<TCustomerPurchaseInfoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const load = useCallback(async (customerId: number, pageIndex: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCustomerPurchaseInfoService(customerId, {
        offset: pageIndex * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
      setData(result)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar as informações do cliente.'
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || customer == null) {
      setData(null)
      setError(null)
      setPage(0)
      return
    }
    void load(customer.id, page)
  }, [open, customer, page, load])

  const totalPages = data?.recent_lines.pagination.pages ?? 0
  const currentPage = totalPages > 0 ? page + 1 : 0

  function formatLocation(city: string | null, state: string | null): string {
    const cityTrim = city?.trim()
    const stateTrim = state?.trim()
    if (cityTrim && stateTrim) {
      const ufLabel =
        BRAZIL_UF_EXTENDED_LABELS[stateTrim as keyof typeof BRAZIL_UF_EXTENDED_LABELS] ??
        stateTrim
      return `${cityTrim} — ${stateTrim} (${ufLabel})`
    }
    if (cityTrim) return cityTrim
    if (stateTrim) return stateTrim
    return '—'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,56rem)] max-w-xl flex-col overflow-hidden sm:max-w-2xl">
        {customer ? (
          <>
            <DialogHeader>
              <DialogTitle>Informações do cliente</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {customer.name} — {formatLocation(customer.city, customer.state)}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {error ? (
                <p
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              {loading && !data ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando informações…
                </div>
              ) : null}

              {data ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <StatCard
                      label="Cartas compradas"
                      value={String(data.stats.total_units)}
                    />
                    <StatCard
                      label="Pedidos confirmados"
                      value={String(data.stats.order_count)}
                    />
                    <StatCard
                      label="Valor dos pedidos"
                      value={formatCurrency(data.stats.total_order_value)}
                    />
                    <StatCard
                      label="Valor já pago"
                      value={formatCurrency(data.stats.total_paid)}
                    />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cartas por jogo
                    </p>
                    {data.units_by_tcg.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {data.units_by_tcg.map((row) => (
                          <span
                            key={row.tcg}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs"
                          >
                            <span className="font-medium">{TCG_LABELS[row.tcg]}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {row.total_units}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhuma compra confirmada ainda.
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Últimas cartas em pedido
                    </p>
                    {data.recent_lines.items.length > 0 ? (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="py-2 pr-3 font-medium">Data</th>
                              <th className="py-2 pr-3 font-medium">Carta</th>
                              <th className="py-2 pr-3 font-medium">Modelo</th>
                              <th className="py-2 pr-3 text-right font-medium">Qtd</th>
                              <th className="py-2 pr-3 text-right font-medium">Valor</th>
                              <th className="py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.recent_lines.items.map((line, index) => (
                              <tr
                                key={`${line.order_id}-${index}`}
                                className="border-b border-border/40 last:border-0"
                              >
                                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                                  {formatOrderSummaryDateShort(line.order_date)}
                                </td>
                                <td className="py-2 pr-3 min-w-[10rem]">
                                  {formatOrderLineCardLabel(line.card)}
                                </td>
                                <td className="py-2 pr-3 text-muted-foreground">
                                  {line.card_print_model?.name ?? 'Modelo pendente'}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums">
                                  {line.quantity}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums">
                                  {formatCurrency(line.line_total)}
                                </td>
                                <td className="py-2 text-muted-foreground">
                                  {ORDER_STATUS_LABELS[line.order_status]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhuma compra confirmada ainda.
                      </p>
                    )}

                    {totalPages > 1 ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={loading || page <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                          >
                            <ChevronLeft className="size-3.5" aria-hidden />
                            Anterior
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={loading || page >= totalPages - 1}
                            onClick={() => setPage((p) => p + 1)}
                          >
                            Próxima
                            <ChevronRight className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ApiError from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { CardColorDots } from '@/components/CardColorDots'
import {
  ART_STATUS_LABELS,
  type TOrderLineArtStatus,
} from '@/modules/order/types/order.model'
import { formatOrderLineCardLabel } from '@/modules/order/lib/order-summary-text'
import { createProductionShipmentService } from '@/modules/production/services/create-production-shipment.service'
import { getProductionGraphicSummaryService } from '@/modules/production/services/get-production-graphic-summary.service'
import { listProductionShipmentsService } from '@/modules/production/services/list-production-shipments.service'
import { moveProductionOrderItemService } from '@/modules/production/services/move-production-order-item.service'
import { patchProductionOrderItemArtService } from '@/modules/production/services/patch-production-order-item-art.service'
import { patchProductionShipmentService } from '@/modules/production/services/patch-production-shipment.service'
import type {
  TProductionShipmentLine,
  TProductionShipmentListItem,
  TProductionShipmentStatus,
} from '@/modules/production/types/production.model'

const STATUS_LABELS: Record<TProductionShipmentStatus, string> = {
  awaiting_print: 'Aguardando impressão',
  printing: 'Em impressão',
  printed: 'Impresso',
}

function forwardShipmentStatuses(
  from: TProductionShipmentStatus,
): TProductionShipmentStatus[] {
  if (from === 'awaiting_print') return ['printing', 'printed']
  if (from === 'printing') return ['printed']
  return []
}

function chipClass(status: TProductionShipmentStatus): string {
  switch (status) {
    case 'awaiting_print':
      return 'border border-border bg-muted/50 text-foreground'
    case 'printing':
      return 'border border-violet-500/40 bg-violet-500/12 text-foreground'
    case 'printed':
      return 'border border-emerald-600/40 bg-emerald-600/12 text-foreground'
    default:
      return ''
  }
}

export function ProducaoPage() {
  const [items, setItems] = useState<TProductionShipmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const [hideActions, setHideActions] = useState(false)
  const [graphicLoadingId, setGraphicLoadingId] = useState<number | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [artUpdatingKey, setArtUpdatingKey] = useState<string | null>(null)
  const [moveUpdatingItemId, setMoveUpdatingItemId] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<TProductionShipmentStatus>('awaiting_print')
  const [createBusy, setCreateBusy] = useState(false)

  const loadShipments = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await listProductionShipmentsService()
      setItems(data.items)
      setError(null)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar a produção.'
      setError(msg)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadShipments()
  }, [loadShipments])

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleShipmentStatus(id: number, next: TProductionShipmentStatus) {
    setStatusUpdatingId(id)
    try {
      await patchProductionShipmentService(id, { status: next })
      await loadShipments({ silent: true })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível atualizar a remessa.'
      setError(msg)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  async function handleCopyGraphic(id: number) {
    setGraphicLoadingId(id)
    try {
      const data = await getProductionGraphicSummaryService(id)
      await navigator.clipboard.writeText(data.clipboard_text)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível copiar o resumo.'
      setError(msg)
    } finally {
      setGraphicLoadingId(null)
    }
  }

  async function toggleLineArt(shipmentId: number, line: TProductionShipmentLine) {
    if (line.art_status !== 'art_to_do' && line.art_status !== 'art_ready') return
    const next: 'art_to_do' | 'art_ready' =
      line.art_status === 'art_to_do' ? 'art_ready' : 'art_to_do'
    const key = `${shipmentId}-${line.order_item_id}`
    setArtUpdatingKey(key)
    try {
      const { art_status } = await patchProductionOrderItemArtService(
        shipmentId,
        line.order_item_id,
        {
          art_status: next,
        },
      )
      setItems((prev) =>
        prev.map((sh) =>
          sh.id !== shipmentId
            ? sh
            : {
                ...sh,
                lines: sh.lines.map((l) =>
                  l.order_item_id === line.order_item_id ? { ...l, art_status } : l,
                ),
              },
        ),
      )
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível atualizar a arte.'
      setError(msg)
    } finally {
      setArtUpdatingKey(null)
    }
  }

  async function handleMoveLine(
    fromShipmentId: number,
    line: TProductionShipmentLine,
    toShipmentIdStr: string,
  ) {
    const toShipmentId = Number(toShipmentIdStr)
    if (fromShipmentId === toShipmentId) return
    setMoveUpdatingItemId(line.order_item_id)
    try {
      await moveProductionOrderItemService(toShipmentId, line.order_item_id)
      setItems((prev) =>
        prev.map((sh) => {
          if (sh.id === fromShipmentId) {
            return {
              ...sh,
              lines: sh.lines.filter((l) => l.order_item_id !== line.order_item_id),
            }
          }
          if (sh.id === toShipmentId) {
            const nextLines = [...sh.lines, line].sort((a, b) => a.order_item_id - b.order_item_id)
            return { ...sh, lines: nextLines }
          }
          return sh
        }),
      )
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível mover a linha.'
      setError(msg)
    } finally {
      setMoveUpdatingItemId(null)
    }
  }

  async function handleCreateShipment() {
    setCreateBusy(true)
    setError(null)
    try {
      await createProductionShipmentService({ status: createStatus })
      setCreateDialogOpen(false)
      await loadShipments({ silent: true })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível criar a remessa.'
      setError(msg)
    } finally {
      setCreateBusy(false)
    }
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.display_number - a.display_number),
    [items],
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produção</h1>
          <p className="text-sm text-muted-foreground">
            Remessas sequenciais derivadas dos pedidos. Copie o texto para a gráfica por remessa e
            ajuste o status da arte aqui.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-3.5" />
            Nova remessa
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setHideActions((v) => !v)}
          >
            {hideActions ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {hideActions ? 'Mostrar ações' : 'Ocultar ações'}
          </Button>
        </div>
      </header>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova remessa</DialogTitle>
            <DialogDescription>
              Cria a próxima remessa na sequência (#). Só pode haver uma em “Aguardando impressão”; para
              arquivo de pedidos já concluídos, escolha “Em impressão” ou “Impresso”.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label className="text-xs text-muted-foreground">Status inicial</Label>
            <Select
              value={createStatus}
              onValueChange={(v) => setCreateStatus(v as TProductionShipmentStatus)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="awaiting_print">{STATUS_LABELS.awaiting_print}</SelectItem>
                <SelectItem value="printing">{STATUS_LABELS.printing}</SelectItem>
                <SelectItem value="printed">{STATUS_LABELS.printed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createBusy}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreateShipment()} disabled={createBusy}>
              {createBusy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Criando…
                </>
              ) : (
                'Criar remessa'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {error ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando remessas…
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma remessa</CardTitle>
            <CardDescription>
              Salve um pedido com itens para gerar linhas na remessa atual, ou crie uma remessa
              manualmente para organizar o arquivo.
            </CardDescription>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2 w-fit gap-1.5"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              Nova remessa
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((shipment) => {
            const open = expanded.has(shipment.id)
            const busy = statusUpdatingId === shipment.id
            return (
              <Card key={shipment.id}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">
                      Remessa #{shipment.display_number}
                    </CardTitle>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        chipClass(shipment.status),
                      )}
                    >
                      {STATUS_LABELS[shipment.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => toggleExpanded(shipment.id)}
                    >
                      {open ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                      {open ? 'Recolher' : 'Expandir'}
                    </Button>
                    {!hideActions ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={graphicLoadingId === shipment.id}
                          onClick={() => void handleCopyGraphic(shipment.id)}
                        >
                          {graphicLoadingId === shipment.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          Copiar resumo gráfica
                        </Button>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Status
                          </Label>
                          <Select
                            disabled={busy || forwardShipmentStatuses(shipment.status).length === 0}
                            value={shipment.status}
                            onValueChange={(v) =>
                              void handleShipmentStatus(shipment.id, v as TProductionShipmentStatus)
                            }
                          >
                            <SelectTrigger className="h-8 w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={shipment.status}>
                                {STATUS_LABELS[shipment.status]}
                              </SelectItem>
                              {forwardShipmentStatuses(shipment.status).map((st) => (
                                <SelectItem key={st} value={st}>
                                  {STATUS_LABELS[st]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : null}
                  </div>
                </CardHeader>
                {open ? (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Carta</th>
                            <th className="py-2 pr-3 font-medium">Modelo / arquivo</th>
                            <th className="py-2 pr-3 text-right font-medium">Qtd</th>
                            <th className="py-2 pr-3 font-medium">Pedido</th>
                            <th className="py-2 pr-3 font-medium">Cliente</th>
                            <th className="py-2 pr-3 font-medium">Arte</th>
                            {!hideActions ? (
                              <th className="py-2 pl-3 font-medium whitespace-nowrap">Remessa</th>
                            ) : null}
                          </tr>
                        </thead>
                        <tbody>
                          {shipment.lines.length === 0 ? (
                            <tr>
                              <td
                                colSpan={hideActions ? 6 : 7}
                                className="py-6 text-muted-foreground"
                              >
                                Sem linhas nesta remessa.
                              </td>
                            </tr>
                          ) : (
                            shipment.lines.map((line) => {
                              const canToggleArt =
                                line.art_status === 'art_to_do' ||
                                line.art_status === 'art_ready'
                              const artKey = `${shipment.id}-${line.order_item_id}`
                              return (
                                <tr key={line.order_item_id} className="border-b border-border/60">
                                  <td className="py-2 pr-3 align-top">
                                    <div className="flex items-start gap-2">
                                      <CardColorDots colors={line.card.colors} />
                                      <span className="leading-snug">
                                        {formatOrderLineCardLabel(line.card)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 pr-3 align-top">
                                    <div className="font-medium">{line.card_print_model.name}</div>
                                    <div className="font-mono text-xs text-muted-foreground">
                                      {line.card_print_model.file_name}
                                    </div>
                                  </td>
                                  <td className="py-2 pr-3 align-top text-right tabular-nums">
                                    {line.quantity}
                                  </td>
                                  <td className="py-2 pr-3 align-top">#{line.order_id}</td>
                                  <td className="py-2 pr-3 align-top">{line.customer_name}</td>
                                  <td className="py-2 pl-3 align-top">
                                    {canToggleArt ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        disabled={artUpdatingKey === artKey}
                                        onClick={() => void toggleLineArt(shipment.id, line)}
                                      >
                                        {artUpdatingKey === artKey ? (
                                          <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                          ART_STATUS_LABELS[line.art_status]
                                        )}
                                      </Button>
                                    ) : (
                                      <span className="text-sm">
                                        {ART_STATUS_LABELS[line.art_status as TOrderLineArtStatus]}
                                      </span>
                                    )}
                                  </td>
                                  {!hideActions ? (
                                    <td className="py-2 pl-3 align-top">
                                      {sorted.filter((s) => s.id !== shipment.id).length === 0 ? (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      ) : (
                                        <Select
                                          disabled={moveUpdatingItemId === line.order_item_id}
                                          onValueChange={(v) =>
                                            void handleMoveLine(shipment.id, line, v)
                                          }
                                        >
                                          <SelectTrigger className="h-8 w-[180px]">
                                            <SelectValue placeholder="Mover para…" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {sorted
                                              .filter((s) => s.id !== shipment.id)
                                              .sort((a, b) => b.display_number - a.display_number)
                                              .map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                  #{s.display_number} — {STATUS_LABELS[s.status]}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </td>
                                  ) : null}
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

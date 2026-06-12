import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, Pencil } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
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
import {
  CARD_COLOR_HEX,
  CARD_TYPE_LABELS,
  TCG_LABELS,
  type TCard,
  type TTcg,
} from '@/modules/card/types/card.model'
import { listPrintBacklogService } from '@/modules/order/services/list-print-backlog.service'
import {
  ORDER_STATUS_LABELS,
  type TPrintBacklogItem,
} from '@/modules/order/types/order.model'
import { listStockService } from '@/modules/stock/services/list-stock.service'
import { patchStockService } from '@/modules/stock/services/patch-stock.service'
import type { TStockRow } from '@/modules/stock/types/stock.model'

const TCG_OPTIONS: TTcg[] = ['one_piece', 'magic', 'pokemon']

function cardPrimaryLabel(card: TCard): string {
  if (card.name?.trim()) return card.name.trim()
  return CARD_TYPE_LABELS[card.card_type]
}

function cardSecondaryLine(card: TCard): string | null {
  const edition = card.edition?.trim()
  if (edition) return `${TCG_LABELS[card.tcg]} · ${edition}`
  return TCG_LABELS[card.tcg]
}

export function EstoquePage() {
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState<TStockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TTcg | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<TStockRow | null>(null)
  const [quantityInput, setQuantityInput] = useState('0')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [onlyGraphicNeed, setOnlyGraphicNeed] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [printBacklog, setPrintBacklog] = useState<TPrintBacklogItem[]>([])
  const [backlogLoading, setBacklogLoading] = useState(true)
  const [backlogError, setBacklogError] = useState<string | null>(null)

  const refresh = useCallback(async (tcg: TTcg | null, query: string, inStockOnly: boolean) => {
    setLoading(true)
    setListError(null)
    try {
      const q = query.trim()
      const data = await listStockService({
        ...(tcg ? { tcg } : {}),
        ...(q ? { q } : {}),
        ...(inStockOnly ? { in_stock_only: true } : {}),
        limit: 500,
      })
      setRows(data.items)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar o estoque.'
      setListError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchParams.get('graphic_need') === '1') {
      setOnlyGraphicNeed(true)
    }
  }, [searchParams])

  useEffect(() => {
    void refresh(filter, search, onlyInStock)
  }, [filter, search, onlyInStock, refresh])

  const refreshBacklog = useCallback(async () => {
    setBacklogLoading(true)
    setBacklogError(null)
    try {
      const data = await listPrintBacklogService({ limit: 50 })
      setPrintBacklog(data.items)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar pedidos com impressão pendente.'
      setBacklogError(msg)
    } finally {
      setBacklogLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshBacklog()
  }, [refreshBacklog])

  function closeForm() {
    setFormOpen(false)
    setEditingRow(null)
    setQuantityInput('0')
    setFormError(null)
  }

  function openAdjust(row: TStockRow) {
    setEditingRow(row)
    setQuantityInput(String(row.on_hand))
    setFormError(null)
    setFormOpen(true)
  }

  const displayedRows = useMemo(() => {
    if (!onlyGraphicNeed) return rows
    return rows.filter((r) => r.need_for_graphic > 0)
  }, [rows, onlyGraphicNeed])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingRow) return

    const parsed = Number.parseInt(quantityInput.trim(), 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFormError('Informe um número inteiro maior ou igual a zero.')
      return
    }

    setFormError(null)
    setSubmitting(true)
    try {
      await patchStockService(editingRow.card.id, parsed)
      closeForm()
      await refresh(filter, search, onlyInStock)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível atualizar o estoque.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <p className="text-sm text-muted-foreground">
          Controle unidades <strong>prontas</strong> por carta. Pedidos em{' '}
          <strong>entregue</strong> dão baixa no estoque automaticamente. A coluna{' '}
          <strong>Falta (gráfica)</strong> ignora linhas já em impressão ou impressas. Para copiar o texto
          enviado à gráfica por lote de produção, use a página <strong>Produção</strong>.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-3 sm:gap-4">
          <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-[200px] sm:max-w-md">
            <Label
              htmlFor="stock-search"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Buscar
            </Label>
            <Input
              id="stock-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou edição da carta"
              aria-label="Buscar estoque por nome ou edição da carta"
            />
          </div>
          <div className="grid min-w-0 gap-1.5 sm:max-w-xs sm:flex-1">
            <Label
              htmlFor="stock-filter-tcg"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              TCG
            </Label>
            <Select
              value={filter ?? 'all'}
              onValueChange={(v) => setFilter(v === 'all' ? null : (v as TTcg))}
            >
              <SelectTrigger id="stock-filter-tcg" className="w-full sm:min-w-[220px]">
                <SelectValue placeholder="Filtrar por TCG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TCG_OPTIONS.map((tcg) => (
                  <SelectItem key={tcg} value={tcg}>
                    {TCG_LABELS[tcg]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
            />
            Só cartas com saldo em estoque
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={onlyGraphicNeed}
              onChange={(e) => setOnlyGraphicNeed(e.target.checked)}
            />
            Só cartas com falta para gráfica
          </label>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pedidos com impressão pendente</CardTitle>
          <CardDescription>
            Pedidos comprometidos (fora de orçamento e entregue) com linhas que ainda precisam ir à
            gráfica — exclui itens marcados como atender do estoque e arte já em impressão ou
            impressa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backlogError ? (
            <p
              className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {backlogError}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Pedido</th>
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">Linhas</th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">Sem modelo</th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">Unidades</th>
                  <th className="py-2 pl-3 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {backlogLoading ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando…
                      </span>
                    </td>
                  </tr>
                ) : printBacklog.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      Nenhum pedido com impressão pendente no momento.
                    </td>
                  </tr>
                ) : (
                  printBacklog.map((row) => (
                    <tr key={row.order_id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-3 font-medium tabular-nums">#{row.order_id}</td>
                      <td className="py-2 pr-3">{row.customer_name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {ORDER_STATUS_LABELS[row.order_status]}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {row.pending_print_lines}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {row.missing_model_lines > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {row.missing_model_lines}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.total_units}</td>
                      <td className="py-2 pl-3 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/pedidos?orderId=${row.order_id}`}>Abrir pedido</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Saldo e demanda</CardTitle>
          <CardDescription>
            <strong>Arte pendente</strong> soma só linhas cuja arte não está em impressão nem
            impressa. <strong>Falta (pedidos)</strong> usa toda a demanda do pedido;{' '}
            <strong>Falta (gráfica)</strong> usa essa arte pendente e o estoque atual — alinhado ao
            resumo por remessa na página Produção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listError ? (
            <p
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {listError}
            </p>
          ) : null}

          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="min-w-[200px] py-2 pr-3 font-medium">Carta</th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">
                    Em estoque
                  </th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">
                    Demanda (pedidos)
                  </th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">
                    Demanda (orç.)
                  </th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">
                    Arte pendente
                  </th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">Saldo</th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">
                    Falta (pedidos)
                  </th>
                  <th className="py-2 pr-3 text-right font-medium tabular-nums">
                    Falta (gráfica)
                  </th>
                  <th className="w-[120px] py-2 pl-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando estoque…
                      </span>
                    </td>
                  </tr>
                ) : displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-muted-foreground">
                      {onlyGraphicNeed && rows.length > 0
                        ? 'Nenhuma carta com falta para a gráfica neste filtro.'
                        : onlyInStock && rows.length > 0
                          ? 'Nenhuma carta com saldo em estoque neste filtro.'
                          : 'Nenhuma carta encontrada com os filtros atuais.'}
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const card = row.card
                    const deficit = row.available_after_orders < 0
                    return (
                      <tr
                        key={card.id}
                        className={cn(
                          'border-b border-border/40 last:border-0',
                          row.need_for_graphic > 0 ? 'bg-amber-500/5' : '',
                        )}
                      >
                        <td className="py-2 pr-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium leading-tight">
                              {cardPrimaryLabel(card)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {cardSecondaryLine(card)}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {CARD_TYPE_LABELS[card.card_type]}
                              </span>
                              {card.colors.map((color) => (
                                <span
                                  key={color}
                                  className="inline-block size-2.5 rounded-full border border-border/80"
                                  style={{ backgroundColor: CARD_COLOR_HEX[color] }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-right align-top tabular-nums">
                          {row.on_hand}
                        </td>
                        <td className="py-2 pr-3 text-right align-top tabular-nums">
                          {row.demand_open}
                        </td>
                        <td className="py-2 pr-3 text-right align-top tabular-nums text-muted-foreground">
                          {row.demand_quote}
                        </td>
                        <td className="py-2 pr-3 text-right align-top tabular-nums">
                          {row.demand_pending_print}
                        </td>
                        <td
                          className={cn(
                            'py-2 pr-3 text-right align-top tabular-nums',
                            deficit ? 'font-medium text-destructive' : '',
                          )}
                        >
                          {row.available_after_orders}
                        </td>
                        <td
                          className={cn(
                            'py-2 pr-3 text-right align-top tabular-nums',
                            row.need_to_produce > 0
                              ? 'font-medium text-amber-600 dark:text-amber-500'
                              : '',
                          )}
                        >
                          {row.need_to_produce}
                        </td>
                        <td
                          className={cn(
                            'py-2 pr-3 text-right align-top tabular-nums',
                            row.need_for_graphic > 0
                              ? 'font-medium text-amber-600 dark:text-amber-500'
                              : '',
                          )}
                        >
                          {row.need_for_graphic}
                        </td>
                        <td className="py-2 pl-3 text-right align-top">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => openAdjust(row)}
                          >
                            <Pencil className="size-3.5" />
                            Ajustar
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
            <DialogDescription>
              Defina quantas unidades <strong>prontas</strong> você tem desta carta. Ao marcar um
              pedido como <strong>entregue</strong>, o sistema reduz esse saldo pelas quantidades do
              pedido (mínimo zero).
            </DialogDescription>
          </DialogHeader>
          {editingRow ? (
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium">{cardPrimaryLabel(editingRow.card)}</p>
                <p className="text-muted-foreground">
                  {cardSecondaryLine(editingRow.card)}
                </p>
              </div>

              {formError ? (
                <p
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="stock-qty">Quantidade em estoque</Label>
                <Input
                  id="stock-qty"
                  inputMode="numeric"
                  autoComplete="off"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  disabled={submitting}
                  min={0}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

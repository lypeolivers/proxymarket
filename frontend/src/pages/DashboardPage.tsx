import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BRAZIL_UF_CODES, BRAZIL_UF_EXTENDED_LABELS } from '@/lib/brazil-regions'
import ApiError from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { TCG_LABELS, type TTcg } from '@/modules/card/types/card.model'
import type { TCard } from '@/modules/card/types/card.model'
import { formatOrderLineCardLabel } from '@/modules/order/lib/order-summary-text'
import { getOrderStatsService } from '@/modules/order/services/get-order-stats.service'
import {
  ART_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  formatCurrency,
  type TGetOrderStatsParams,
  type TOrderStats,
} from '@/modules/order/types/order.model'

const TCG_OPTIONS: TTcg[] = ['one_piece', 'magic', 'pokemon']

type PeriodMonths = 3 | 6 | 12

const PRODUCTION_ART_STATUSES = ['printing', 'printed'] as const

const ART_BAR_COLORS: Record<(typeof PRODUCTION_ART_STATUSES)[number], string> = {
  printing: 'var(--chart-2, hsl(270 55% 55%))',
  printed: 'var(--chart-1, hsl(145 45% 38%))',
}

function formatMonthChartLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-')
  if (!y || !m) return yyyyMm
  return `${m}/${y}`
}

function insightCardLabel(
  card: NonNullable<TOrderStats['insights']['top_card_by_quantity']>,
): string {
  return formatOrderLineCardLabel({
    tcg: card.tcg as TCard['tcg'],
    card_type: card.card_type as TCard['card_type'],
    name: card.name,
    edition: card.edition,
  })
}

function DashboardKpiCard({
  title,
  description,
  value,
  sub,
  href,
  className,
}: {
  title: string
  description: string
  value: React.ReactNode
  sub?: React.ReactNode
  href?: string
  className?: string
}) {
  const content = (
    <>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {href ? (
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-semibold tabular-nums', className)}>{value}</div>
        {sub ? <div className="mt-2 text-sm text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </>
  )

  if (href) {
    return (
      <Link to={href} className="block rounded-xl transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Card className="h-full border-transparent shadow-none hover:border-border">{content}</Card>
      </Link>
    )
  }

  return <Card>{content}</Card>
}

export function DashboardPage() {
  const { auth } = useAuth()
  const [stats, setStats] = useState<TOrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodMonths, setPeriodMonths] = useState<PeriodMonths>(12)
  const [tcgFilter, setTcgFilter] = useState<TTcg | null>(null)
  const [stateFilter, setStateFilter] = useState<(typeof BRAZIL_UF_CODES)[number] | null>(null)

  const statsParams = useMemo((): TGetOrderStatsParams => {
    return {
      period_months: periodMonths,
      ...(tcgFilter ? { tcg: tcgFilter } : {}),
      ...(stateFilter ? { customer_state: stateFilter } : {}),
    }
  }, [periodMonths, tcgFilter, stateFilter])

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrderStatsService(statsParams)
      setStats(data)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível carregar os indicadores.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [statsParams])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const artChartData = useMemo(() => {
    if (!stats) return []
    return PRODUCTION_ART_STATUSES.map((status) => ({
      status,
      label: ART_STATUS_LABELS[status],
      count: stats.items_by_art_status[status],
    }))
  }, [stats])

  const hasArtData = artChartData.some((d) => d.count > 0)

  const dualChartData = useMemo(() => {
    if (!stats) return []
    return stats.revenue_by_month.map((row, index) => ({
      month: formatMonthChartLabel(row.month),
      monthKey: row.month,
      received: row.revenue,
      confirmed: stats.confirmed_revenue_by_month[index]?.revenue ?? 0,
    }))
  }, [stats])

  const hasDualChartData = dualChartData.some((d) => d.received > 0 || d.confirmed > 0)

  const filterHint =
    tcgFilter || stateFilter
      ? `Filtros ativos${tcgFilter ? `: ${TCG_LABELS[tcgFilter]}` : ''}${stateFilter ? `${tcgFilter ? ',' : ':'} UF ${stateFilter}` : ''}.`
      : null

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo{auth?.name ? `, ${auth.name.split(' ')[0]}` : ''}. Acompanhe orçamentos,
            produção, estoque e recebimentos.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dashboard-period" className="text-xs text-muted-foreground">
              Período dos gráficos
            </Label>
            <Select
              value={String(periodMonths)}
              onValueChange={(v) => setPeriodMonths(Number(v) as PeriodMonths)}
            >
              <SelectTrigger id="dashboard-period" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dashboard-tcg" className="text-xs text-muted-foreground">
              TCG
            </Label>
            <Select
              value={tcgFilter ?? 'all'}
              onValueChange={(v) => setTcgFilter(v === 'all' ? null : (v as TTcg))}
            >
              <SelectTrigger id="dashboard-tcg" className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os jogos</SelectItem>
                {TCG_OPTIONS.map((tcg) => (
                  <SelectItem key={tcg} value={tcg}>
                    {TCG_LABELS[tcg]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dashboard-uf" className="text-xs text-muted-foreground">
              UF do cliente
            </Label>
            <Select
              value={stateFilter ?? 'all'}
              onValueChange={(v) =>
                setStateFilter(v === 'all' ? null : (v as (typeof BRAZIL_UF_CODES)[number]))
              }
            >
              <SelectTrigger id="dashboard-uf" className="w-[180px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as UFs</SelectItem>
                {BRAZIL_UF_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code} — {BRAZIL_UF_EXTENDED_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {filterHint ? (
        <p className="text-sm text-muted-foreground">{filterHint} Gráficos usam os últimos {periodMonths} meses (UTC).</p>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando indicadores…
        </div>
      ) : stats ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashboardKpiCard
              title="Orçamentos pendentes"
              description="Pedidos no estágio de orçamento."
              value={stats.quotes_count}
              sub={`Pipeline: ${formatCurrency(stats.pipeline_value)}`}
              href="/pedidos?status=quote"
            />

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>Pedidos em andamento</CardTitle>
                    <CardDescription>Pagamento e produção em curso.</CardDescription>
                  </div>
                  <Link to="/pedidos" className="text-muted-foreground hover:text-foreground" aria-label="Ver pedidos">
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.in_progress_count}</p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li className="flex justify-between gap-2">
                    <Link to="/pedidos?status=partial_payment" className="hover:text-foreground hover:underline">
                      {ORDER_STATUS_LABELS.partial_payment}
                    </Link>
                    <span className="tabular-nums font-medium text-foreground">
                      {stats.in_progress_by_status.partial_payment}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <Link to="/pedidos?status=paid" className="hover:text-foreground hover:underline">
                      {ORDER_STATUS_LABELS.paid}
                    </Link>
                    <span className="tabular-nums font-medium text-foreground">
                      {stats.in_progress_by_status.paid}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <Link to="/pedidos?status=awaiting_payment" className="hover:text-foreground hover:underline">
                      {ORDER_STATUS_LABELS.awaiting_payment}
                    </Link>
                    <span className="tabular-nums font-medium text-foreground">
                      {stats.in_progress_by_status.awaiting_payment}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <DashboardKpiCard
              title="Prontos para a entrega"
              description="Aguardando envio ou retirada."
              value={stats.ready_for_delivery_count}
              href="/pedidos?status=ready_for_delivery"
            />

            <DashboardKpiCard
              title="Recebido no mês"
              description="Pagamentos com data de recolhimento no mês atual (UTC)."
              value={formatCurrency(stats.revenue_month)}
            />

            <DashboardKpiCard
              title="A receber"
              description="Saldo em aberto em pedidos confirmados (exceto entregues)."
              value={formatCurrency(stats.amount_due_total)}
              sub={`${stats.orders_with_balance_count} pedido(s) com saldo`}
              href="/pedidos?with_balance=1"
            />

            <DashboardKpiCard
              title="Unidades para a gráfica"
              description="Demanda pendente menos estoque pronto (global)."
              value={stats.operations.graphic_total_units}
              sub="unidades a enviar à impressão"
              href="/estoque?graphic_need=1"
            />

            <DashboardKpiCard
              title="Proxys ativos"
              description="Cartas disponíveis no catálogo."
              value={stats.active_cards_count}
              href="/cartas"
            />

            <DashboardKpiCard
              title="Pedidos entregues"
              description="Encomendas finalizadas."
              value={stats.delivered_count}
              href="/pedidos?status=delivered"
            />
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="operations-heading">
            <div>
              <h2 id="operations-heading" className="text-lg font-semibold tracking-tight">
                Operação
              </h2>
              <p className="text-sm text-muted-foreground">
                Produção, impressão e fila da gráfica — complementa o estoque e a página de produção.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardKpiCard
                title="Impressão pendente"
                description="Pedidos com linhas ainda não na gráfica/impressas."
                value={stats.operations.print_backlog_order_count}
                sub="pedidos"
                href="/estoque"
              />

              <DashboardKpiCard
                title="Fora da produção"
                description="Linhas elegíveis ainda sem remessa."
                value={stats.operations.pending_production_lines}
                sub="linhas"
                href="/pedidos"
              />

              <DashboardKpiCard
                title="Modelos pendentes"
                description="Linhas sem modelo de impressão definido."
                value={stats.operations.missing_print_model_lines}
                sub="linhas"
                href="/pedidos"
              />

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>Remessa aberta</CardTitle>
                      <CardDescription>Remessa aguardando impressão.</CardDescription>
                    </div>
                    <Link to="/producao" className="text-muted-foreground hover:text-foreground" aria-label="Ver produção">
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.operations.open_shipment ? (
                    <>
                      <p className="text-3xl font-semibold tabular-nums">
                        #{stats.operations.open_shipment.display_number}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {stats.operations.open_shipment.line_count} linha(s) ·{' '}
                        {stats.operations.open_shipment.total_units} un.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma remessa aberta.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>Impressão na gráfica</CardTitle>
                    <CardDescription>
                      Linhas em impressão ou já impressas (status da remessa de produção).
                    </CardDescription>
                  </div>
                  <Link to="/producao" className="text-sm text-muted-foreground hover:text-foreground">
                    Produção →
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {!hasArtData ? (
                  <p className="text-sm text-muted-foreground">Nenhuma linha registrada ainda.</p>
                ) : null}
                <div className="h-[220px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={artChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={108}
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number | string) => [
                          typeof value === 'number' ? value : Number(value),
                          'Linhas',
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {artChartData.map((entry) => (
                          <Cell key={entry.status} fill={ART_BAR_COLORS[entry.status]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="insights-heading">
            <div>
              <h2 id="insights-heading" className="text-lg font-semibold tracking-tight">
                Insights
              </h2>
              <p className="text-sm text-muted-foreground">
                Orçamentos não entram nos rankings. &quot;Melhor cliente (valor)&quot; usa soma de
                recebimentos registrados, não valor de pedido.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Melhor cliente (valor)</CardTitle>
                  <CardDescription>Maior soma de recebimentos.</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.insights.top_customer_by_revenue ? (
                    <>
                      <p className="font-medium leading-snug">
                        {stats.insights.top_customer_by_revenue.name}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums">
                        {formatCurrency(stats.insights.top_customer_by_revenue.total_revenue)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Carta mais vendida</CardTitle>
                  <CardDescription>Maior quantidade em pedidos confirmados.</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.insights.top_card_by_quantity ? (
                    <>
                      <p className="text-sm font-medium leading-snug">
                        {insightCardLabel(stats.insights.top_card_by_quantity)}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums">
                        {stats.insights.top_card_by_quantity.total_quantity}{' '}
                        <span className="text-base font-normal text-muted-foreground">un.</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cliente que mais pediu</CardTitle>
                  <CardDescription>Maior quantidade total de cartas.</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.insights.top_customer_by_units ? (
                    <>
                      <p className="font-medium leading-snug">
                        {stats.insights.top_customer_by_units.name}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums">
                        {stats.insights.top_customer_by_units.total_units}{' '}
                        <span className="text-base font-normal text-muted-foreground">cartas</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos confirmados vs recebidos</CardTitle>
                <CardDescription>
                  Comparativo mensal: valor dos pedidos pela data comercial (
                  <code className="text-xs">order_date</code>) vs caixa recolhido (
                  <code className="text-xs">collected_at</code>). Últimos {periodMonths} meses (UTC).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {!hasDualChartData ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum dado no período selecionado.
                  </p>
                ) : null}
                <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dualChartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        tickFormatter={(v) => formatCurrency(Number(v))}
                        width={72}
                      />
                      <Tooltip
                        formatter={(value: number | string, name: string) => [
                          formatCurrency(typeof value === 'number' ? value : Number(value)),
                          name === 'confirmed' ? 'Pedidos confirmados' : 'Recebido',
                        ]}
                        labelFormatter={(label) => `Mês ${label}`}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'confirmed' ? 'Pedidos confirmados' : 'Recebido'
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="confirmed"
                        name="confirmed"
                        stroke="hsl(160 45% 38%)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="received"
                        name="received"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ApiError from '@/lib/api-error'
import type { TCard } from '@/modules/card/types/card.model'
import { formatOrderLineCardLabel } from '@/modules/order/lib/order-summary-text'
import { getOrderStatsService } from '@/modules/order/services/get-order-stats.service'
import {
  ART_STATUS_LABELS,
  ART_STATUS_OPTIONS,
  formatCurrency,
  type TOrderStats,
} from '@/modules/order/types/order.model'

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

export function DashboardPage() {
  const { auth } = useAuth()
  const [stats, setStats] = useState<TOrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getOrderStatsService()
        if (active) setStats(data)
      } catch (err) {
        if (!active) return
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Não foi possível carregar os indicadores.'
        setError(msg)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const maxArtCount = stats
    ? Math.max(...ART_STATUS_OPTIONS.map((status) => stats.items_by_art_status[status]), 1)
    : 1

  const revenueChartData = useMemo(() => {
    if (!stats) return []
    return stats.revenue_by_month.map((row) => ({
      month: formatMonthChartLabel(row.month),
      monthKey: row.month,
      revenue: row.revenue,
    }))
  }, [stats])

  const hasMonthlyRevenue = revenueChartData.some((d) => d.revenue > 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo{auth?.name ? `, ${auth.name.split(' ')[0]}` : ''}. Acompanhe orçamentos,
          produção e receita do mês.
        </p>
      </header>

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
            <Card>
              <CardHeader>
                <CardTitle>Orçamentos pendentes</CardTitle>
                <CardDescription>Pedidos no estágio de orçamento.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.quotes_count}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pipeline: {formatCurrency(stats.pipeline_value)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos em andamento</CardTitle>
                <CardDescription>Artes, confirmações e impressão em curso.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.in_progress_count}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prontos para a entrega</CardTitle>
                <CardDescription>Aguardando envio ou retirada.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {stats.ready_for_delivery_count}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita do mês</CardTitle>
                <CardDescription>Soma de pedidos com pagamento parcial ou integral.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {formatCurrency(stats.revenue_month)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proxys ativos</CardTitle>
                <CardDescription>Cartas disponíveis no catálogo.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.active_cards_count}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos entregues</CardTitle>
                <CardDescription>Encomendas finalizadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{stats.delivered_count}</p>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="insights-heading">
            <div>
              <h2 id="insights-heading" className="text-lg font-semibold tracking-tight">
                Insights
              </h2>
              <p className="text-sm text-muted-foreground">
                Pedidos em orçamento não entram nas métricas abaixo. O gráfico mostra faturamento
                por mês (últimos 12 meses, referência UTC).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Melhor cliente (valor)</CardTitle>
                  <CardDescription>Maior soma de pedidos confirmados.</CardDescription>
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
                <CardTitle>Faturamento por mês</CardTitle>
                <CardDescription>Evolução do faturamento em pedidos confirmados.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {!hasMonthlyRevenue ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum faturamento registrado no período.
                  </p>
                ) : null}
                <div className="h-[280px] w-full min-w-0 text-primary">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueChartData}
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
                        formatter={(value: number | string) => [
                          formatCurrency(typeof value === 'number' ? value : Number(value)),
                          'Faturamento',
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
                      <Line
                        type="monotone"
                        dataKey="revenue"
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

          <Card>
            <CardHeader>
              <CardTitle>Produção por status de arte</CardTitle>
              <CardDescription>Distribuição das linhas de pedido por etapa.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {ART_STATUS_OPTIONS.map((status) => {
                const count = stats.items_by_art_status[status]
                const width = Math.max((count / maxArtCount) * 100, count > 0 ? 8 : 0)
                return (
                  <div key={status} className="grid gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{ART_STATUS_LABELS[status]}</span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

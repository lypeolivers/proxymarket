/** Série de meses em UTC (YYYY-MM) para alinhar bucket SQL com date_trunc no fuso da sessão UTC. */
export function buildLastNUtcMonthKeys(monthCount: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
  }
  return keys;
}

/** Primeiro instante (UTC) do mês mais antigo na série de N meses (inclui o mês atual). */
export function startOfOldestMonthUtc(monthCount: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1, 0, 0, 0, 0));
}

export type MonthlyRevenueRow = { month_key: string; revenue: unknown };

export function mergeMonthlyRevenueIntoSeries(
  templateKeys: string[],
  rows: MonthlyRevenueRow[],
): { month: string; revenue: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.month_key;
    const raw = r.revenue;
    const num = typeof raw === 'number' ? raw : Number(raw);
    map.set(key, Math.round(num * 100) / 100);
  }
  return templateKeys.map((month) => ({
    month,
    revenue: map.get(month) ?? 0,
  }));
}

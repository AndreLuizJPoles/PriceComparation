import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PriceHistoryPeriod, PriceHistoryPoint } from '@/types/api'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'

const PERIODS: { value: PriceHistoryPeriod; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '1y', label: '1 ano' },
]

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[]
  period: PriceHistoryPeriod
  onPeriodChange: (period: PriceHistoryPeriod) => void
  isLoading?: boolean
}

export function PriceHistoryChart({
  data,
  period,
  onPeriodChange,
  isLoading = false,
}: PriceHistoryChartProps) {
  const [activeStore, setActiveStore] = useState<string | 'all'>('all')

  const stores = useMemo(() => {
    const slugs = data
      .map((point) => point.store_slug)
      .filter((slug): slug is string => Boolean(slug))
    return Array.from(new Set(slugs))
  }, [data])

  const chartData = useMemo(() => {
    const filtered =
      activeStore === 'all' ? data : data.filter((point) => point.store_slug === activeStore)

    const byDate = new Map<string, Record<string, string | number>>()

    for (const point of filtered) {
      const dateKey = new Date(point.observed_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
      const row = byDate.get(dateKey) ?? { date: dateKey }
      const slugKey = point.store_slug ?? point.store_name ?? 'loja'
      row[slugKey] = Number.parseFloat(point.total_price)
      byDate.set(dateKey, row)
    }

    return Array.from(byDate.values())
  }, [data, activeStore])

  const colors = ['#0d9488', '#334155', '#14b8a6', '#64748b', '#115e59']

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm sm:p-6" aria-label="Histórico de preços">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-surface-900">Histórico de preços</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onPeriodChange(item.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                period === item.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 text-surface-800 hover:bg-surface-200',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {stores.length > 1 && (
        <StoreFilter stores={stores} activeStore={activeStore} onChange={setActiveStore} />
      )}

      <div className="mt-6 h-72 w-full">
        {isLoading ? (
          <p className="flex h-full items-center justify-center text-sm text-surface-700">
            Carregando gráfico…
          </p>
        ) : chartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-surface-700">
            Sem dados históricos para o período selecionado.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis
                tickFormatter={(value: number) => formatCurrency(value)}
                tick={{ fontSize: 11 }}
                width={72}
                stroke="#64748b"
              />
              <Tooltip
                formatter={(value) => formatCurrency(typeof value === 'number' ? value : Number(value))}
                labelStyle={{ color: '#0f172a' }}
              />
              <Legend />
              {(activeStore === 'all' ? stores : [activeStore]).map((slug, index) => (
                <Line
                  key={slug}
                  type="monotone"
                  dataKey={slug}
                  name={slug}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

function StoreFilter({
  stores,
  activeStore,
  onChange,
}: {
  stores: string[]
  activeStore: string | 'all'
  onChange: (value: string | 'all') => void
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'rounded-lg px-3 py-1 text-xs font-medium',
          activeStore === 'all' ? 'bg-brand-100 text-brand-800' : 'bg-surface-100',
        )}
      >
        Todas as lojas
      </button>
      {stores.map((slug) => (
        <button
          key={slug}
          type="button"
          onClick={() => onChange(slug)}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-medium',
            activeStore === slug ? 'bg-brand-100 text-brand-800' : 'bg-surface-100',
          )}
        >
          {slug}
        </button>
      ))}
    </div>
  )
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deleteAlert, fetchAlerts, updateAlert } from '@/services/alerts'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { PriceAlertItem } from '@/types/api'

export function AlertsPage() {
  const queryClient = useQueryClient()

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAlert(id, { is_active: !isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const isBusy = toggleMutation.isPending || deleteMutation.isPending

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-900">Alertas de preço</h1>
      <p className="mt-2 text-sm text-surface-700">
        Você será avisado quando o preço total ficar no valor desejado.{' '}
        <span className="text-surface-700">(E-mail em modo demonstração.)</span>
      </p>

      {alertsQuery.isLoading && <LoadingState />}
      {alertsQuery.isError && (
        <ErrorState error={alertsQuery.error} onRetry={() => void alertsQuery.refetch()} />
      )}

      {alertsQuery.isSuccess && alertsQuery.data.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-surface-200 bg-white p-10 text-center text-sm">
          Nenhum alerta ativo. Crie um alerta na página de um produto após fazer login.
        </p>
      )}

      {alertsQuery.isSuccess && alertsQuery.data.length > 0 && (
        <ul className="mt-8 space-y-4">
          {alertsQuery.data.map((alert) => (
            <li
              key={alert.id}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
            >
              <AlertRow
                alert={alert}
                onToggle={() => toggleMutation.mutate({ id: alert.id, isActive: alert.is_active })}
                onDelete={() => deleteMutation.mutate(alert.id)}
                isBusy={isBusy}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AlertRow({
  alert,
  onToggle,
  onDelete,
  isBusy,
}: {
  alert: PriceAlertItem
  onToggle: () => void
  onDelete: () => void
  isBusy: boolean
}) {
  const productId = alert.product_id ?? alert.product.id

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link
          to={`/products/${productId}`}
          className="text-lg font-semibold text-surface-900 hover:text-brand-700"
        >
          {alert.product.name}
        </Link>
        <p className="mt-1 text-sm text-surface-700">
          Meta: <strong>{formatCurrency(alert.target_price)}</strong>
          {alert.last_triggered_at && (
            <span> · Último disparo: {formatDateTime(alert.last_triggered_at)}</span>
          )}
        </p>
        <p className="mt-1 text-xs text-surface-700">
          Status: {alert.is_active ? 'Ativo' : 'Pausado'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={onToggle}
          className="rounded-lg border border-surface-200 px-3 py-2 text-sm hover:bg-surface-50"
        >
          {alert.is_active ? 'Pausar' : 'Ativar'}
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onDelete}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}
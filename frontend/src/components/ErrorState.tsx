import { NetworkError, ApiClientError } from '@/types/api'
import { cn } from '@/lib/cn'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}

function resolveMessage(error: unknown): string {
  if (error instanceof NetworkError) return error.message
  if (error instanceof ApiClientError) return error.message
  if (error instanceof Error) return error.message
  return 'Algo deu errado. Tente novamente.'
}

export function ErrorState({ error, onRetry, title = 'Não foi possível carregar', className }: ErrorStateProps) {
  const message = resolveMessage(error)
  const isOffline = error instanceof NetworkError

  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-red-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur',
        className,
      )}
    >
      <p className="text-lg font-semibold text-surface-900">{title}</p>
      <p className="mt-2 text-sm text-surface-700">{message}</p>
      {isOffline && (
        <p className="mt-2 text-xs text-surface-700">
          Verifique se o backend está em execução e se a variável VITE_API_BASE_URL está correta.
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
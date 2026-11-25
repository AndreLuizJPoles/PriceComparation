interface LoadingStateProps {
  label?: string
  compact?: boolean
}

export function LoadingState({ label = 'Carregando…', compact = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={compact ? 'flex items-center gap-3 py-4' : 'flex flex-col items-center gap-4 py-12'}
    >
      <span
        className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        aria-hidden
      />
      <p className="text-sm text-surface-700">{label}</p>
    </div>
  )
}
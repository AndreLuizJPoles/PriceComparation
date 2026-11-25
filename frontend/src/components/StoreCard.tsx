import type { Store } from '@/types/api'
import { cn } from '@/lib/cn'

interface StoreCardProps {
  store: Store
  selected?: boolean
  onSelect?: (slug: string) => void
}

export function StoreCard({ store, selected, onSelect }: StoreCardProps) {
  const isInteractive = Boolean(onSelect)

  const content = (
    <>
      <p className="font-semibold text-surface-900">{store.name}</p>
      <p className="mt-1 text-xs text-surface-700">
        Confiabilidade: {store.reliability_tier ?? '—'}
        {store.is_demo && ' · Demo'}
      </p>
    </>
  )

  if (!isInteractive) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-4">{content}</div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(store.slug)}
      aria-pressed={selected}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition',
        selected
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
          : 'border-surface-200 bg-white hover:border-brand-200',
      )}
    >
      {content}
    </button>
  )
}
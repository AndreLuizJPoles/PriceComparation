import type { ProductOffer } from '@/types/api'
import { formatCurrency, formatDateTime, availabilityLabel, parsePrice } from '@/lib/format'
import { cn } from '@/lib/cn'

interface PriceComparisonProps {
  offers: ProductOffer[]
}

export function PriceComparison({ offers }: PriceComparisonProps) {
  if (offers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-surface-200 bg-white p-8 text-center text-sm text-surface-700">
        Nenhuma oferta disponível para este produto.
      </p>
    )
  }

  const sorted = [...offers].sort((a, b) => parsePrice(a.total_price) - parsePrice(b.total_price))
  const bestTotal = parsePrice(sorted[0]?.total_price)

  return (
    <div className="space-y-4">
      {sorted.map((offer) => {
        const isBest = parsePrice(offer.total_price) === bestTotal
        return (
          <article
            key={offer.id}
            className={cn(
              'rounded-2xl border bg-white p-5 shadow-sm',
              isBest ? 'border-brand-500 ring-2 ring-brand-100' : 'border-surface-200',
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {isBest && (
                  <span className="mb-2 inline-block rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Melhor oferta
                  </span>
                )}
                <h3 className="text-lg font-semibold text-surface-900">{offer.store.name}</h3>
                <p className="mt-1 text-sm text-surface-700">
                  {availabilityLabel(offer.availability)} · Atualizado em{' '}
                  {formatDateTime(offer.last_checked_at)}
                </p>
                {offer.is_demo && (
                  <p className="mt-1 text-xs text-amber-700">Preço demonstrativo</p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-brand-800">
                  {formatCurrency(offer.total_price)}
                </p>
                <p className="text-xs text-surface-700">total com frete</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-surface-700">Produto</dt>
                <dd className="font-medium">{formatCurrency(offer.promotional_price ?? offer.original_price)}</dd>
              </div>
              <div>
                <dt className="text-surface-700">Frete</dt>
                <dd className="font-medium">{formatCurrency(offer.shipping_price)}</dd>
              </div>
              <div>
                <dt className="text-surface-700">De</dt>
                <dd className="font-medium line-through opacity-70">
                  {formatCurrency(offer.original_price)}
                </dd>
              </div>
            </dl>
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-surface-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-surface-800"
            >
              Ir para a loja
            </a>
          </article>
        )
      })}
    </div>
  )
}
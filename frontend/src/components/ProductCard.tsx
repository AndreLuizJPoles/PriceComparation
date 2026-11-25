import { Link } from 'react-router-dom'
import type { ProductSummary } from '@/types/api'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'

interface ProductCardProps {
  product: ProductSummary
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md',
        className,
      )}
    >
      <Link to={`/products/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-surface-700">
              Sem imagem
            </div>
          )}
          {product.is_demo && (
            <span className="absolute left-2 top-2 rounded-md bg-surface-900/80 px-2 py-0.5 text-xs text-white">
              Demo
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            {product.category ?? 'Geral'}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-surface-900">
            {product.name}
          </h3>
          {product.brand && (
            <p className="mt-1 text-sm text-surface-700">{product.brand}</p>
          )}
          <div className="mt-auto pt-4">
            <p className="text-lg font-bold text-brand-800">
              {product.min_total_price !== null
                ? formatCurrency(product.min_total_price)
                : 'Preço sob consulta'}
            </p>
            <p className="text-xs text-surface-700">
              {product.offer_count > 0
                ? `${product.offer_count} oferta${product.offer_count > 1 ? 's' : ''}`
                : 'Sem ofertas'}
            </p>
          </div>
        </div>
      </Link>
    </article>
  )
}
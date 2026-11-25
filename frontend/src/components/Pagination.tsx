import { cn } from '@/lib/cn'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((p) => {
    if (totalPages <= 7) return true
    return Math.abs(p - page) <= 2 || p === 1 || p === totalPages
  })

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
        aria-label="Página anterior"
      >
        Anterior
      </button>
      {pages.map((p, index) => {
        const showEllipsis = index > 0 && p - pages[index - 1] > 1
        return (
          <span key={p} className="flex items-center gap-2">
            {showEllipsis && <span className="px-1 text-surface-700">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'min-w-10 rounded-lg border px-3 py-2 text-sm transition',
                p === page
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-surface-200 bg-white text-surface-800 hover:border-brand-300',
              )}
            >
              {p}
            </button>
          </span>
        )
      })}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </nav>
  )
}
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { SearchBar } from '@/components/SearchBar'
import { FilterSidebar, type FilterValues } from '@/components/FilterSidebar'
import { ProductCard } from '@/components/ProductCard'
import { Pagination } from '@/components/Pagination'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { fetchCategories, searchProducts } from '@/services/products'
import { FALLBACK_CATEGORIES, FALLBACK_STORES } from '@/lib/constants'
import type { ProductSummary, SearchSort } from '@/types/api'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [draftFilters, setDraftFilters] = useState<FilterValues>(() => parseFilters(searchParams))
  const [applied, setApplied] = useState<FilterValues>(() => parseFilters(searchParams))

  const page = Number.parseInt(searchParams.get('page') ?? '1', 10) || 1
  const queryText = searchParams.get('q') ?? ''

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    retry: 1,
  })

  const categories = categoriesQuery.isSuccess
    ? categoriesQuery.data.map((c) => ({ slug: c.slug, name: c.name }))
    : [...FALLBACK_CATEGORIES]

  const searchQuery = useQuery({
    queryKey: ['search', queryText, applied, page],
    queryFn: () =>
      searchProducts({
        q: queryText || undefined,
        category: applied.category || undefined,
        min_price: applied.minPrice ? Number(applied.minPrice) : undefined,
        max_price: applied.maxPrice ? Number(applied.maxPrice) : undefined,
        store: applied.store || undefined,
        sort: applied.sort,
        page,
        limit: 12,
      }),
  })

  const pagination = searchQuery.data?.meta?.pagination
  const totalPages = pagination?.total_pages ?? 1

  const handleApplyFilters = () => {
    setApplied(draftFilters)
    const next = new URLSearchParams(searchParams)
    if (draftFilters.category) next.set('category', draftFilters.category)
    else next.delete('category')
    if (draftFilters.store) next.set('store', draftFilters.store)
    else next.delete('store')
    if (draftFilters.minPrice) next.set('min_price', draftFilters.minPrice)
    else next.delete('min_price')
    if (draftFilters.maxPrice) next.set('max_price', draftFilters.maxPrice)
    else next.delete('max_price')
    if (draftFilters.sort !== 'relevance') next.set('sort', draftFilters.sort)
    else next.delete('sort')
    next.set('page', '1')
    setSearchParams(next)
  }

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resultLabel = useMemo(() => {
    const total = searchQuery.data?.meta?.pagination?.total
    if (total === undefined) return null
    return `${total} resultado${total === 1 ? '' : 's'}`
  }, [searchQuery.data?.meta?.pagination?.total])

  return (
    <span className="contents">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-surface-900">Buscar produtos</h1>
        <SearchBarSection initialQuery={initialQuery} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <FilterSidebar
            values={draftFilters}
            categories={categories}
            stores={[...FALLBACK_STORES]}
            onChange={setDraftFilters}
            onApply={handleApplyFilters}
          />

          <SearchResults
            searchQuery={searchQuery}
            queryText={queryText}
            resultLabel={resultLabel}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </span>
  )
}

function SearchBarSection({ initialQuery }: { initialQuery: string }) {
  return (
    <div className="mt-4 max-w-2xl">
      <SearchBar defaultQuery={initialQuery} variant="compact" />
    </div>
  )
}

function SearchResults({
  searchQuery,
  queryText,
  resultLabel,
  page,
  totalPages,
  onPageChange,
}: {
  searchQuery: ReturnType<typeof useQuery<Awaited<ReturnType<typeof searchProducts>>>>
  queryText: string
  resultLabel: string | null
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-surface-700">
          {queryText ? (
            <>
              Resultados para <strong className="text-surface-900">{queryText}</strong>
            </>
          ) : (
            'Todos os produtos'
          )}
        </p>
        {resultLabel && <p className="text-sm text-surface-700">{resultLabel}</p>}
      </div>

      {searchQuery.isLoading && <LoadingState />}
      {searchQuery.isError && (
        <ErrorState error={searchQuery.error} onRetry={() => void searchQuery.refetch()} />
      )}
      {searchQuery.isSuccess && searchQuery.data.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-surface-200 bg-white p-10 text-center text-sm text-surface-700">
          Nenhum produto encontrado. Tente outros termos ou filtros.
        </p>
      )}
      {searchQuery.isSuccess && searchQuery.data.data.length > 0 && (
        <>
          <ResultsGrid products={searchQuery.data.data} />
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </>
      )}
    </div>
  )
}

function ResultsGrid({ products }: { products: ProductSummary[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function parseFilters(params: URLSearchParams): FilterValues {
  const sortParam = params.get('sort') as SearchSort | null
  const validSort: SearchSort[] = ['relevance', 'price_asc', 'price_desc', 'name_asc']
  return {
    category: params.get('category') ?? '',
    minPrice: params.get('min_price') ?? '',
    maxPrice: params.get('max_price') ?? '',
    store: params.get('store') ?? '',
    sort: sortParam && validSort.includes(sortParam) ? sortParam : 'relevance',
  }
}
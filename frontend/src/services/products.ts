import { buildQuery, apiRequest, apiRequestWithMeta } from '@/services/api-client'
import {
  normalizeOffer,
  normalizeProduct,
  type CategoryOption,
  type ComparisonResult,
  type PriceHistoryPeriod,
  type PriceHistoryResponse,
  type ProductDetail,
  type ProductOffer,
  type ProductSummary,
  type SearchFilters,
} from '@/types/api'
import { FALLBACK_CATEGORIES } from '@/lib/constants'

function mapProducts(items: unknown[]): ProductSummary[] {
  return items.map((item) => normalizeProduct(item as Record<string, unknown>))
}

export async function fetchProducts(params?: { limit?: number; page?: number; category?: string }) {
  const result = await apiRequestWithMeta<unknown[]>(
    `/products${buildQuery({
      page_size: params?.limit ?? 12,
      page: params?.page ?? 1,
      category: params?.category,
    })}`,
  )
  return { data: mapProducts(result.data), meta: result.meta }
}

export async function searchProducts(filters: SearchFilters) {
  const pageSize = filters.page_size ?? filters.limit ?? 12
  const result = await apiRequestWithMeta<unknown[]>(
    `/products/search${buildQuery({
      q: filters.q ?? '',
      category: filters.category,
      min_price: filters.min_price,
      max_price: filters.max_price,
      store: filters.store,
      sort: filters.sort ?? 'relevance',
      page: filters.page ?? 1,
      page_size: pageSize,
    })}`,
  )
  return { data: mapProducts(result.data), meta: result.meta }
}

export async function fetchProductSuggestions(query: string) {
  if (query.trim().length < 2) return [] as ProductSummary[]
  const result = await searchProducts({ q: query, page_size: 8, page: 1 })
  return result.data
}

export async function fetchProductById(id: string) {
  const raw = await apiRequest<Record<string, unknown>>(`/products/${id}`)
  return normalizeProduct(raw) as ProductDetail
}

export async function fetchProductOffers(id: string): Promise<ProductOffer[]> {
  const comparison = await apiRequest<ComparisonResult | ProductOffer[]>(`/products/${id}/offers`)
  if (Array.isArray(comparison)) {
    return comparison.map((item) => normalizeOffer(item as unknown as Record<string, unknown>))
  }
  const offers = comparison.offers ?? []
  return offers.map((item) => normalizeOffer(item as unknown as Record<string, unknown>))
}

export async function fetchProductPriceHistory(id: string, period: PriceHistoryPeriod) {
  const raw = await apiRequest<PriceHistoryResponse | unknown[]>(
    `/products/${id}/price-history${buildQuery({ period })}`,
  )
  if (Array.isArray(raw)) {
    return raw as PriceHistoryResponse['points']
  }
  return raw.points
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  try {
    return await apiRequest<CategoryOption[]>('/products/categories')
  } catch {
    return FALLBACK_CATEGORIES.map((item) => ({
      slug: item.slug,
      name: item.name,
      product_count: 0,
    }))
  }
}

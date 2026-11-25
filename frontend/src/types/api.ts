export interface ApiErrorBody {
  code: string
  message: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ResponseMeta {
  pagination?: PaginationMeta
  is_demo?: boolean
  demo_banner?: string | null
}

export interface ApiEnvelope<T> {
  data: T | null
  meta?: ResponseMeta
  error?: ApiErrorBody
}

export interface ProductSummary {
  id: string
  name: string
  brand: string | null
  model: string | null
  category: string | null
  description: string | null
  image_url: string | null
  canonical_key?: string
  best_price: string | number | null
  currency?: string
  is_demo: boolean
  /** Convenience aliases used by UI components */
  min_total_price: number | null
  offer_count: number
}

export interface ProductDetail extends ProductSummary {
  identifiers?: Array<{ type: string; value: string }>
}

export interface Store {
  id?: string
  slug: string
  name: string
  website_url?: string
  is_active?: boolean
  is_demo: boolean
  reliability_tier?: string
}

export interface ProductOffer {
  id: string
  store_slug: string
  store_name: string
  store: Store
  original_price: string
  promotional_price: string | null
  shipping_price: string
  total_price: string
  currency: string
  availability: string
  url: string
  product_url?: string | null
  is_demo: boolean
  is_best?: boolean
  last_checked_at: string
  observed_at?: string
  match_confidence?: number | null
}

export interface ComparisonResult {
  best_offer: ProductOffer | null
  offers: ProductOffer[]
  match_confidence?: number | null
  savings_vs_worst?: string | null
}

export interface PriceHistoryPoint {
  observed_at: string
  total_price: string
  promotional_price: string | null
  shipping_price: string
  store_slug?: string
  store_name?: string
}

export interface PriceHistoryResponse {
  period: string
  points: PriceHistoryPoint[]
  stats: {
    min: string | null
    max: string | null
    avg: string | null
  }
}

export type PriceHistoryPeriod = '7d' | '30d' | '90d' | '1y'

export interface UserProfile {
  id: string
  email: string
  name: string
  is_active: boolean
  created_at: string
}

export interface AuthLoginResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface FavoriteItem {
  id: string
  product_id?: string
  product: ProductSummary
  created_at?: string
}

export interface PriceAlertItem {
  id: string
  product_id?: string
  product: ProductSummary
  target_price: string
  is_active: boolean
  last_triggered_at: string | null
  created_at?: string
}

export type SearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc'

export interface SearchFilters {
  q?: string
  category?: string
  min_price?: number
  max_price?: number
  store?: string
  sort?: SearchSort
  page?: number
  limit?: number
  page_size?: number
}

export interface CategoryOption {
  slug: string
  name: string
  product_count: number
}

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor(message = 'Não foi possível conectar ao servidor. Tente novamente em instantes.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function normalizeProduct(raw: Record<string, unknown>): ProductSummary {
  const best = raw.best_price ?? raw.min_total_price ?? null
  const bestNumber =
    best === null || best === undefined ? null : typeof best === 'number' ? best : Number(best)

  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    brand: (raw.brand as string | null) ?? null,
    model: (raw.model as string | null) ?? null,
    category: (raw.category as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    image_url: (raw.image_url as string | null) ?? null,
    canonical_key: raw.canonical_key ? String(raw.canonical_key) : undefined,
    best_price: best as string | number | null,
    currency: (raw.currency as string | undefined) ?? 'BRL',
    is_demo: Boolean(raw.is_demo ?? true),
    min_total_price: Number.isFinite(bestNumber as number) ? (bestNumber as number) : null,
    offer_count: typeof raw.offer_count === 'number' ? raw.offer_count : bestNumber !== null ? 1 : 0,
  }
}

export function normalizeOffer(raw: Record<string, unknown>): ProductOffer {
  const storeSlug = String(raw.store_slug ?? (raw.store as { slug?: string } | undefined)?.slug ?? '')
  const storeName = String(raw.store_name ?? (raw.store as { name?: string } | undefined)?.name ?? storeSlug)
  const storeObj = (raw.store as ProductOffer['store'] | undefined) ?? {
    slug: storeSlug,
    name: storeName,
    is_demo: Boolean(raw.is_demo ?? true),
  }

  return {
    id: String(raw.id),
    store_slug: storeSlug,
    store_name: storeName,
    store: {
      ...storeObj,
      slug: storeObj.slug || storeSlug,
      name: storeObj.name || storeName,
      is_demo: storeObj.is_demo ?? Boolean(raw.is_demo ?? true),
    },
    original_price: String(raw.original_price),
    promotional_price: raw.promotional_price !== null && raw.promotional_price !== undefined
      ? String(raw.promotional_price)
      : null,
    shipping_price: String(raw.shipping_price ?? '0'),
    total_price: String(raw.total_price),
    currency: String(raw.currency ?? 'BRL'),
    availability: String(raw.availability ?? 'in_stock'),
    url: String(raw.product_url ?? raw.url ?? '#'),
    product_url: (raw.product_url as string | null | undefined) ?? null,
    is_demo: Boolean(raw.is_demo ?? true),
    is_best: Boolean(raw.is_best),
    last_checked_at: String(raw.last_checked_at ?? raw.observed_at ?? new Date().toISOString()),
    observed_at: raw.observed_at ? String(raw.observed_at) : undefined,
  }
}

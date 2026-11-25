import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SearchBar } from '@/components/SearchBar'
import { ProductCard } from '@/components/ProductCard'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { fetchCategories, fetchProducts } from '@/services/products'
import { FALLBACK_CATEGORIES, POPULAR_SEARCHES } from '@/lib/constants'
import type { ProductSummary } from '@/types/api'

const HOW_IT_WORKS = [
  {
    title: 'Busque',
    text: 'Digite o produto e use filtros por categoria, loja e faixa de preço.',
  },
  {
    title: 'Compare',
    text: 'Veja o total com frete, disponibilidade e qual loja está na frente.',
  },
  {
    title: 'Acompanhe',
    text: 'Histórico em gráfico e alertas quando o valor atingir sua meta.',
  },
] as const

export function HomePage() {
  const featuredQuery = useQuery({
    queryKey: ['home-featured'],
    queryFn: () => fetchProducts({ limit: 8, page: 1 }),
  })

  const offersQuery = useQuery({
    queryKey: ['home-recent-offers'],
    queryFn: () => fetchProducts({ limit: 4, page: 1 }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    retry: 1,
  })

  const categories = categoriesQuery.isSuccess
    ? categoriesQuery.data.map((item) => ({ slug: item.slug, name: item.name }))
    : [...FALLBACK_CATEGORIES]

  return (
    <>
      <section className="border-b border-brand-100/60 bg-gradient-to-br from-brand-50 via-white to-surface-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
              Comparador inteligente
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 md:text-4xl">
              Encontre o melhor preço entre lojas em segundos
            </h1>
            <p className="mt-4 text-base text-surface-700">
              Pesquise produtos, compare frete e total, acompanhe histórico e crie alertas quando o
              preço baixar.
            </p>
          </div>
          <SearchBar variant="hero" autoFocus />
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-surface-700">Sugestões:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                to={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-brand-200 bg-white px-3 py-1 text-sm text-brand-800 transition hover:bg-brand-50"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <SectionHeader title="Produtos em destaque" href="/search" />
        {featuredQuery.isLoading && <LoadingState />}
        {featuredQuery.isError && (
          <ErrorState error={featuredQuery.error} onRetry={() => void featuredQuery.refetch()} />
        )}
        {featuredQuery.isSuccess && <ProductGrid products={featuredQuery.data.data} />}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <SectionHeader title="Ofertas recentes" href="/search?sort=price_asc" />
        {offersQuery.isLoading && <LoadingState />}
        {offersQuery.isError && (
          <ErrorState error={offersQuery.error} onRetry={() => void offersQuery.refetch()} />
        )}
        {offersQuery.isSuccess && <ProductGrid products={offersQuery.data.data} />}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-surface-900">Categorias</h2>
        <CategoriesGrid categories={categories} />
      </section>

      <section className="border-t border-surface-200 bg-white/60 px-4 py-16">
        <HowItWorks />
      </section>
    </>
  )
}

function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function CategoriesGrid({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => (
        <Link
          key={category.slug}
          to={`/search?category=${encodeURIComponent(category.slug)}`}
          className="rounded-2xl border border-surface-200 bg-white p-5 text-center shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <span className="font-medium text-surface-900">{category.name}</span>
        </Link>
      ))}
    </div>
  )
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold text-surface-900">{title}</h2>
      <Link to={href} className="text-sm font-medium text-brand-700 hover:text-brand-800">
        Ver todos
      </Link>
    </div>
  )
}

function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-center text-2xl font-semibold text-surface-900">Como funciona</h2>
      <ol className="mt-10 grid gap-8 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-surface-900">{step.title}</h3>
            <p className="mt-2 text-sm text-surface-700">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
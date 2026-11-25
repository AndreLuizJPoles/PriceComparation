import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PriceComparison } from '@/components/PriceComparison'
import { PriceHistoryChart } from '@/components/PriceHistoryChart'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import {
  fetchProductById,
  fetchProductOffers,
  fetchProductPriceHistory,
} from '@/services/products'
import { addFavorite, removeFavorite, fetchFavorites } from '@/services/favorites'
import { createAlert } from '@/services/alerts'
import { useAuth } from '@/contexts/AuthContext'
import type { PriceHistoryPeriod } from '@/types/api'
import { formatCurrency } from '@/lib/format'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<PriceHistoryPeriod>('30d')
  const [targetPrice, setTargetPrice] = useState('')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id ?? ''),
    enabled: Boolean(id),
  })

  const offersQuery = useQuery({
    queryKey: ['product-offers', id],
    queryFn: () => fetchProductOffers(id ?? ''),
    enabled: Boolean(id),
  })

  const historyQuery = useQuery({
    queryKey: ['product-history', id, period],
    queryFn: () => fetchProductPriceHistory(id ?? '', period),
    enabled: Boolean(id),
  })

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
  })

  const isFavorite =
    favoritesQuery.data?.some(
      (item) => item.product_id === id || item.product?.id === id,
    ) ?? false

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      if (isFavorite) await removeFavorite(id)
      else await addFavorite(id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const alertMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      const parsed = Number.parseFloat(targetPrice)
      if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error('Informe um valor válido para o alerta.')
      }
      await createAlert({ product_id: id, target_price: parsed })
    },
    onSuccess: () => {
      setAlertMessage('Alerta criado. Gerencie em Alertas.')
      setTargetPrice('')
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: (error: Error) => {
      setAlertMessage(error.message)
    },
  })

  if (!id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ErrorState error={new Error('Produto não informado.')} title="Produto inválido" />
      </div>
    )
  }

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <LoadingState label="Carregando produto…" />
      </div>
    )
  }

  if (productQuery.isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ErrorState
          error={productQuery.error}
          onRetry={() => void productQuery.refetch()}
          title="Produto não encontrado"
        />
      </div>
    )
  }

  const product = productQuery.data
  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <ErrorState error={new Error('Produto não encontrado.')} title="Produto não encontrado" />
      </div>
    )
  }

  const categorySlug = product.category ?? 'geral'

  return (
    <span className="contents">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <nav className="text-sm text-surface-700" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-700">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link
            to={`/search?category=${encodeURIComponent(categorySlug)}`}
            className="hover:text-brand-700"
          >
            {product.category ?? 'Categoria'}
          </Link>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt=""
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-surface-100 text-surface-700">
                Sem imagem
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-brand-700">{product.category}</p>
            <h1 className="mt-2 text-2xl font-bold text-surface-900 md:text-3xl">{product.name}</h1>
            {product.brand && (
              <p className="mt-2 text-surface-700">
                {product.brand}
                {product.model ? ` · ${product.model}` : ''}
              </p>
            )}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-surface-700">{product.description}</p>
            )}
            <p className="mt-6 text-3xl font-bold text-brand-800">
              {product.min_total_price !== null
                ? `a partir de ${formatCurrency(product.min_total_price)}`
                : 'Consulte as ofertas abaixo'}
            </p>
            {product.is_demo && (
              <p className="mt-2 text-sm text-amber-700">Produto em catálogo demonstrativo</p>
            )}

            {isAuthenticated ? (
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  disabled={favoriteMutation.isPending}
                  onClick={() => favoriteMutation.mutate()}
                  className="rounded-xl border border-brand-600 px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
                >
                  {isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                </button>
                <form
                  className="flex flex-col gap-2 sm:flex-row sm:items-end"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setAlertMessage(null)
                    alertMutation.mutate()
                  }}
                >
                  <label className="flex-1 text-sm font-medium text-surface-800">
                    Alerta de preço (total R$)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={targetPrice}
                      onChange={(event) => setTargetPrice(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
                      placeholder="Ex.: 1999.90"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={alertMutation.isPending}
                    className="rounded-xl bg-surface-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-surface-800 disabled:opacity-60"
                  >
                    Criar alerta
                  </button>
                </form>
                {alertMessage && (
                  <p className="text-sm text-surface-700" role="status">
                    {alertMessage}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-6 text-sm text-surface-700">
                <Link to="/login" className="font-medium text-brand-700 hover:underline">
                  Entre
                </Link>{' '}
                para salvar favoritos e criar alertas.
              </p>
            )}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-surface-900">Comparar ofertas</h2>
          {offersQuery.isLoading && <LoadingState compact />}
          {offersQuery.isError && (
            <ErrorState
              error={offersQuery.error}
              onRetry={() => void offersQuery.refetch()}
              title="Ofertas indisponíveis"
            />
          )}
          {offersQuery.isSuccess && <PriceComparison offers={offersQuery.data} />}
        </section>

        <div className="mt-12">
          {historyQuery.isError ? (
            <ErrorState
              error={historyQuery.error}
              onRetry={() => void historyQuery.refetch()}
              title="Histórico indisponível"
            />
          ) : (
            <PriceHistoryChart
              data={historyQuery.data ?? []}
              period={period}
              onPeriodChange={setPeriod}
              isLoading={historyQuery.isLoading}
            />
          )}
        </div>
      </div>
    </span>
  )
}